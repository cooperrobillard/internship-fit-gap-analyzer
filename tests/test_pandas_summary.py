# Import csv so we can create a temporary recurring gaps CSV file.
import csv

# Import sys so we can tell Python where to find the src folder.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so we can create a temporary test folder.
from tempfile import TemporaryDirectory

# Add the src folder to Python's import path.
sys.path.append(str(Path("src")))

from pandas_summary import load_recurring_gaps_csv, get_top_recurring_gaps


def write_fake_recurring_gaps_csv(csv_path, rows):
    """
    Write fake recurring gap rows to a CSV file for testing.
    """
    fieldnames = ["gap_skill", "category", "count"]

    with open(csv_path, "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(row)


def test_load_recurring_gaps_csv_loads_expected_columns():
    with TemporaryDirectory() as temp_folder:
        csv_path = Path(temp_folder) / "recurring_gaps.csv"

        write_fake_recurring_gaps_csv(
            csv_path,
            [
                {"gap_skill": "sql", "category": "data", "count": 3},
                {"gap_skill": "fastapi", "category": "backend", "count": 1},
            ],
        )

        recurring_gaps_dataframe = load_recurring_gaps_csv(csv_path)

        assert list(recurring_gaps_dataframe.columns) == [
            "gap_skill",
            "category",
            "count",
        ]


def test_get_top_recurring_gaps_returns_sorted_top_rows():
    with TemporaryDirectory() as temp_folder:
        csv_path = Path(temp_folder) / "recurring_gaps.csv"

        write_fake_recurring_gaps_csv(
            csv_path,
            [
                {"gap_skill": "fastapi", "category": "backend", "count": 1},
                {"gap_skill": "sql", "category": "data", "count": 3},
                {"gap_skill": "pandas", "category": "data", "count": 2},
                {"gap_skill": "docker", "category": "devops", "count": 1},
            ],
        )

        recurring_gaps_dataframe = load_recurring_gaps_csv(csv_path)

        top_gaps = get_top_recurring_gaps(recurring_gaps_dataframe, limit=2)

        assert len(top_gaps) == 2
        assert top_gaps.iloc[0]["gap_skill"] == "sql"
        assert top_gaps.iloc[0]["count"] == 3

        assert top_gaps.iloc[1]["gap_skill"] == "pandas"
        assert top_gaps.iloc[1]["count"] == 2


if __name__ == "__main__":
    test_load_recurring_gaps_csv_loads_expected_columns()
    test_get_top_recurring_gaps_returns_sorted_top_rows()

    print("All pandas summary tests passed.")
