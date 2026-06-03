# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import pandas so we can load and sort CSV data in tables.
import pandas as pd


def load_recurring_gaps_csv(csv_path):
    """
    Load a recurring gaps CSV file into a pandas DataFrame.

    The CSV is expected to have these columns:
    - gap_skill
    - category
    - count
    """
    csv_path = Path(csv_path)

    recurring_gaps_dataframe = pd.read_csv(csv_path)

    return recurring_gaps_dataframe


def get_top_recurring_gaps(recurring_gaps_dataframe, limit=5):
    """
    Return the top recurring gaps from a DataFrame.

    Rows are sorted by:
    - count (highest first)
    - gap_skill (alphabetical order)
    """
    sorted_dataframe = recurring_gaps_dataframe.sort_values(
        by=["count", "gap_skill"],
        ascending=[False, True],
    )

    top_recurring_gaps = sorted_dataframe.head(limit)

    return top_recurring_gaps


def load_gap_summary_csv(csv_path):
    """
    Load a detailed gap summary CSV file into a pandas DataFrame.

    The CSV is expected to have these columns:
    - job_name
    - category
    - gap_skill
    """
    csv_path = Path(csv_path)

    gap_summary_dataframe = pd.read_csv(csv_path)

    return gap_summary_dataframe


def summarize_gaps_by_category(gaps_dataframe):
    """
    Count gap rows in each category from a detailed gap summary DataFrame.

    The input DataFrame is expected to have these columns:
    - job_name
    - category
    - gap_skill

    Returns a DataFrame with:
    - category
    - gap_count

    Rows are sorted by:
    - gap_count (highest first)
    - category (alphabetical order)
    """
    category_summary = gaps_dataframe.groupby("category").size().reset_index(
        name="gap_count"
    )

    sorted_summary = category_summary.sort_values(
        by=["gap_count", "category"],
        ascending=[False, True],
    )

    return sorted_summary.reset_index(drop=True)
