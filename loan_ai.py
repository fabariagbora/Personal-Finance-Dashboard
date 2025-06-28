import os
import pandas as pd
import pyodbc
import json
import datetime
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
from openai import OpenAI

# --- CONFIGURATION ---
load_dotenv()

# OpenRouter API client setup
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# SQL Server connection
conn_str = (
    f"Driver={os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')};"
    f"Server={os.getenv('DB_SERVER')};"
    f"Database={os.getenv('DB_NAME')};"
    f"UID={os.getenv('DB_USER')};"
    f"PWD={os.getenv('DB_PASSWORD')}"
)
conn = pyodbc.connect(conn_str)

# --- Load loan data ---
query = "SELECT loan_date, Amount, loan_notes FROM Personal_Finance.Loans"
df = pd.read_sql(query, conn) # type: ignore
df['loan_date'] = pd.to_datetime(df['loan_date'])

# --- Monthly aggregates ---
df['MonthNumber'] = df['loan_date'].dt.to_period("M").dt.to_timestamp()
monthly = df.groupby('MonthNumber')['Amount'].sum().reset_index()

# --- Predict next month's loan total ---
X = monthly[['MonthNumber']]
X_encoded = X.copy()
X_encoded['MonthEncoded'] = (X_encoded['MonthNumber'] - X_encoded['MonthNumber'].min()) / pd.Timedelta(days=30)
y = monthly['Amount']

model = LinearRegression().fit(X_encoded[['MonthEncoded']], y)
next_month_raw = monthly['MonthNumber'].max() + pd.DateOffset(months=1)
next_month_encoded = (next_month_raw - X_encoded['MonthNumber'].min()) / pd.Timedelta(days=30)
prediction = max(0, model.predict(pd.DataFrame([[next_month_encoded]], columns=['MonthEncoded']))[0])

# --- Theme classification ---
theme_map = {
    "Business": ["business expansion"],
    "Home Improvement": ["home renovation"],
    "Automotive": ["car repair"],
    "Debt Management": ["debt consolidation"],
    "Healthcare": ["medical"],
    "Travel": ["travel expenses"],
    "Education": ["school fees"],
    "Emergency": ["unexpected expenses"]
}

def assign_theme(note):
    note = note.lower()
    for theme, keywords in theme_map.items():
        if any(keyword in note for keyword in keywords):
            return theme
    return "Other"

recent_loans = df[df['loan_date'] >= df['loan_date'].max() - pd.DateOffset(months=3)]
recent_loans = recent_loans.dropna(subset=['loan_notes'])
recent_loans['theme'] = recent_loans['loan_notes'].apply(assign_theme)
theme_summary = recent_loans['theme'].value_counts().to_dict()

# --- Build context + prompt ---
recent_months = monthly.tail(3).to_dict(orient='records')
context = {
    "last_3_months": recent_months,
    "loan_theme_distribution": theme_summary,
    "predicted_total_loan_next_month": int(prediction),
    "next_month": next_month_raw.strftime('%B %Y')
}

prompt = (
    f"As a financial analyst, here is your report for the board:\n\n"
    f"Recent loan distribution themes (last 3 months): {theme_summary}\n"
    f"Total loan volume in the last 3 months: {recent_months}\n"
    f"Based on trend analysis, the model predicts total loan disbursement next month "
    f"({context['next_month']}) will be ${context['predicted_total_loan_next_month']}.\n\n"
    "Why might this be the case? What patterns or behavior explain this trend? "
    "Provide 3 business recommendations to prepare for this scenario. Write like you are presenting to the board."
)

# ---LLM explanation via OpenRouter ---
try:
    response = client.chat.completions.create(
        model="meta-llama/llama-3.3-8b-instruct:free",
        messages=[
            {"role": "system", "content": "You are a helpful financial analyst assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    explanation = response.choices[0].message.content
except Exception as e:
    explanation = f"Could not generate explanation: {str(e)}"

# --- Save insight to DB ---
# Format dates to ISO-friendly strings
for item in context['last_3_months']:
    if isinstance(item['MonthNumber'], pd.Timestamp):
        item['MonthNumber'] = item['MonthNumber'].strftime('%Y-%m')

context['next_month'] = next_month_raw.strftime('%Y-%m')

insert_query = """
INSERT INTO Personal_Finance.AI_Insights (EntityType, Prediction, ContextSummary, Explanation, CreatedAt)
VALUES (?, ?, ?, ?, ?)
"""

cursor = conn.cursor()
cursor.execute(insert_query, (
    "Loans",
    f"Predicted total loan amount for {context['next_month']}: ${context['predicted_total_loan_next_month']}",
    json.dumps(context),
    explanation,
    datetime.datetime.utcnow()
))
cursor.commit()

print("✅ Loan Insight (theme-enriched) saved successfully!")
