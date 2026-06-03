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
