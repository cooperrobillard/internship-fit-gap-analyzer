# Import csv so we can create a temporary recurring gaps CSV file.
import csv

# Import sys so we can tell Python where to find the src folder.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so we can create a temporary test folder.
from tempfile import TemporaryDirectory

# Import pandas so we can read output CSV files in tests.
import pandas as pd

# Add the src folder to Python's import path.
sys.path.append(str(Path("src")))

from pandas_summary import (
    load_recurring_gaps_csv,
    get_top_recurring_gaps,
    load_gap_summary_csv,
    summarize_gaps_by_category,
    write_pandas_summary_outputs,
)


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


def write_fake_gap_summary_csv(csv_path, rows):
    """
    Write fake detailed gap summary rows to a CSV file for testing.
    """
    fieldnames = ["job_name", "category", "gap_skill"]

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


def test_load_gap_summary_csv_loads_expected_columns():
    with TemporaryDirectory() as temp_folder:
        csv_path = Path(temp_folder) / "gap_summary.csv"

        write_fake_gap_summary_csv(
            csv_path,
            [
                {
                    "job_name": "job_1.txt",
                    "category": "data",
                    "gap_skill": "sql",
                },
                {
                    "job_name": "job_2.txt",
                    "category": "ai_ml",
                    "gap_skill": "langchain",
                },
            ],
        )

        gap_summary_dataframe = load_gap_summary_csv(csv_path)

        assert list(gap_summary_dataframe.columns) == [
            "job_name",
            "category",
            "gap_skill",
        ]


def test_summarize_gaps_by_category_returns_sorted_category_counts():
    with TemporaryDirectory() as temp_folder:
        csv_path = Path(temp_folder) / "gap_summary.csv"

        write_fake_gap_summary_csv(
            csv_path,
            [
                {
                    "job_name": "job_1.txt",
                    "category": "data",
                    "gap_skill": "sql",
                },
                {
                    "job_name": "job_1.txt",
                    "category": "data",
                    "gap_skill": "pandas",
                },
                {
                    "job_name": "job_2.txt",
                    "category": "ai_ml",
                    "gap_skill": "langchain",
                },
                {
                    "job_name": "job_2.txt",
                    "category": "data",
                    "gap_skill": "sql",
                },
            ],
        )

        gap_summary_dataframe = load_gap_summary_csv(csv_path)

        category_summary = summarize_gaps_by_category(gap_summary_dataframe)

        assert list(category_summary.columns) == ["category", "gap_count"]
        assert len(category_summary) == 2

        assert category_summary.iloc[0]["category"] == "data"
        assert category_summary.iloc[0]["gap_count"] == 3

        assert category_summary.iloc[1]["category"] == "ai_ml"
        assert category_summary.iloc[1]["gap_count"] == 1


def test_write_pandas_summary_outputs_writes_expected_csv_files():
    with TemporaryDirectory() as temp_folder:
        temp_folder_path = Path(temp_folder)
        inputs_folder = temp_folder_path / "inputs"
        outputs_folder = temp_folder_path / "outputs"
        inputs_folder.mkdir()

        gap_summary_csv_path = inputs_folder / "gap_summary.csv"
        recurring_gaps_csv_path = inputs_folder / "recurring_gaps.csv"

        write_fake_gap_summary_csv(
            gap_summary_csv_path,
            [
                {
                    "job_name": "job_1.txt",
                    "category": "data",
                    "gap_skill": "sql",
                },
                {
                    "job_name": "job_1.txt",
                    "category": "data",
                    "gap_skill": "pandas",
                },
                {
                    "job_name": "job_2.txt",
                    "category": "ai_ml",
                    "gap_skill": "langchain",
                },
                {
                    "job_name": "job_2.txt",
                    "category": "data",
                    "gap_skill": "sql",
                },
            ],
        )

        write_fake_recurring_gaps_csv(
            recurring_gaps_csv_path,
            [
                {"gap_skill": "fastapi", "category": "backend", "count": 1},
                {"gap_skill": "sql", "category": "data", "count": 3},
                {"gap_skill": "pandas", "category": "data", "count": 2},
            ],
        )

        output_paths = write_pandas_summary_outputs(
            gap_summary_csv_path,
            recurring_gaps_csv_path,
            outputs_folder,
            top_limit=2,
        )

        assert len(output_paths) == 2

        category_summary_path = outputs_folder / "gap_categories_pandas.csv"
        top_recurring_gaps_path = outputs_folder / "top_recurring_gaps_pandas.csv"

        assert category_summary_path.exists()
        assert top_recurring_gaps_path.exists()

        category_summary_dataframe = pd.read_csv(category_summary_path)
        top_recurring_gaps_dataframe = pd.read_csv(top_recurring_gaps_path)

        assert list(category_summary_dataframe.columns) == [
            "category",
            "gap_count",
        ]
        assert list(top_recurring_gaps_dataframe.columns) == [
            "gap_skill",
            "category",
            "count",
        ]

        assert category_summary_dataframe.iloc[0]["category"] == "data"
        assert category_summary_dataframe.iloc[0]["gap_count"] == 3

        assert top_recurring_gaps_dataframe.iloc[0]["gap_skill"] == "sql"
        assert top_recurring_gaps_dataframe.iloc[0]["count"] == 3


if __name__ == "__main__":
    test_load_recurring_gaps_csv_loads_expected_columns()
    test_get_top_recurring_gaps_returns_sorted_top_rows()
    test_load_gap_summary_csv_loads_expected_columns()
    test_summarize_gaps_by_category_returns_sorted_category_counts()
    test_write_pandas_summary_outputs_writes_expected_csv_files()

    print("All pandas summary tests passed.")
