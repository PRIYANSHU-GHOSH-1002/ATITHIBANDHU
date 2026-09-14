import pandas as pd

DATA_PATH = "data/india_tourist_safety_5000_area_dataset.csv"

df = pd.read_csv(DATA_PATH)

print("\nDataset shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())

print("\nMissing values:")
print(df.isnull().sum())

print("\nData types:")
print(df.dtypes)

print("\nSafety score statistics:")
print(df["tourist_safety_score"].describe())