# 📊 Personal Finance Power BI Dashboard

## 🧾 Overview

This project is an interactive **Personal Finance Dashboard** built using Power BI to monitor and analyze:

- 💰 Income  
- 💸 Expenses  
- 🏦 Debt  
- 📈 Investments  

It combines financial tracking, trend analysis, and AI-driven narratives to provide clear insights into personal financial health.

---

## 🚀 Dashboard Features

### 🎨 1. Modern UI/UX Design

- Clean blue-themed layout with consistent styling  
- Navigation tabs: **Overview, Income, Expenses, Debts, Investments**  
- Card-based layout for improved readability  
- Responsive visuals with proper spacing and alignment  

---

### 📌 2. KPI Cards with Micro-Trends

Each page includes a primary KPI card:

- Total Investments  
- Total Debts  
- Total Expenses  

**Enhancements:**

- Embedded mini bar charts *(sparklines)*  
- Percentage change indicators  
- Highlight of latest period performance  

---

### 🤖 3. AI-Driven Narrative (Dynamic Text)

Custom-built using DAX to simulate an AI assistant-like insight panel.

**Features:**

- Time-based greeting *(Morning / Afternoon / Evening)*  
- Dynamic response to slicer selections  
- Automatically generated insights such as:
  - Highest and lowest months  
  - Percentage differences  
  - Contribution analysis  

**Example:**

> “October had the highest total loans and was 69.08% higher than March…”

---

### 📅 4. Monthly Breakdown Tables (Heatmap Style)

- Matrix visuals showing monthly financial activity  

**Categories include:**

- Investments *(Bonds, Stocks, Crypto, etc.)*  
- Expenses *(Food, Rent, Fitness, etc.)*  
- Debt sources *(Banks, Lenders, etc.)*  

**Enhancements:**

- Conditional formatting *(heatmap effect)*  
- Easy identification of trends and anomalies  

---

### 🌳 5. Decomposition Tree Visuals

Used for deep analysis across pages:

- Investments by Type  
- Expenses by Category  
- Debt by Lender  

**Purpose:**

- Break down totals into contributing factors  
- Enable drill-down exploration  
- Highlight top contributors  

---

### 🎛️ 6. Dynamic Filtering

- Year slicer *(e.g., 2023, 2024)*  
- All visuals update dynamically  
- AI narrative adapts to filter context  

---

### 🔄 7. Custom Waterfall Logic (Behind the Scenes)

- Built using **disconnected table + `SWITCH()` measure**  
- Shows financial flow:

`Income → Expenses → Debt → Net Savings`


- Includes custom sorting logic  

---

### 🧠 8. Key DAX Techniques Used

- `SWITCH()` → Conditional logic  
- `CONCATENATEX()` → Dynamic text generation  
- `VALUES()` → Capture user selections  
- `ISFILTERED()` → Detect slicer usage  
- `MIN()` / `MAX()` → Time-based calculations  
- Custom measures for KPIs and trends  

---

## 📊 Insights Delivered

- Monthly and yearly financial trends  
- Category-level spending behavior  
- Investment distribution and performance  
- Debt sources and obligations  
- Comparative analysis *(e.g., highest vs lowest months)*  

---

## ✅ Conclusion

This dashboard demonstrates:

- Strong data modeling and DAX expertise  
- Ability to build interactive and insightful reports  
- Integration of AI-like narratives for storytelling  
- Focus on user experience and design clarity  

It serves as a complete solution for **personal financial tracking and decision-making**.

---

## 🔗 Live Dashboard

👉 [View Dashboard](https://fabariagbora.github.io/Personal-Finance-Dashboard/)
