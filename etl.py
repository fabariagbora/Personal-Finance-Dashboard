import os
import pandas as pd
import urllib
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database configuration from environment variables
DB_TYPE = os.getenv("DB_TYPE", "mssql+pyodbc")  # Default to "mssql+pyodbc"
DB_SERVER = os.getenv("DB_SERVER")  # Azure SQL server name
DB_NAME = os.getenv("DB_NAME")  # Database name
DB_USER = os.getenv("DB_USER")  # Username
DB_PASSWORD = os.getenv("DB_PASSWORD")  # Password
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")  # Default driver

# Ensure password and driver are properly encoded
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
encoded_driver = urllib.parse.quote_plus(DRIVER)

# Construct the database connection URL
DATABASE_URL = f"{DB_TYPE}://{DB_USER}:{encoded_password}@{DB_SERVER}/{DB_NAME}?driver={encoded_driver}"

# Create database engine
engine = create_engine(DATABASE_URL)

# Extract: Read CSV file
csv_file_path = "C:/Users/USER/Documents/InvestmentTable.csv" 
df = pd.read_csv(csv_file_path)

# Transform: Example - Rename columns, handle missing values
df.columns = df.columns.str.lower().str.replace(" ", "_")  # Convert column names to lowercase
df.fillna("", inplace=True)  # Replace NaN with empty strings

# Load: Insert data into the database
table_name = "Investments" 
df.to_sql("Investments", con=engine, schema="Personal_Finance", if_exists="append", index=False)


print(table_name + " Data inserted successfully!")
