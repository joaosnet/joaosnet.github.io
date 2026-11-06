# Environment Security Tests

> 7 nodes · cohesion 0.38

## Key Concepts

- **test_env_variables.py** (8 connections) — `tests/test_env_variables.py`
- **pytest** (4 connections)
- **test_private_import_without_token_does_not_access_network()** (3 connections) — `tests/test_env_variables.py`
- **ast** (2 connections)
- **test_import_does_not_load_dotenv()** (2 connections) — `tests/test_env_variables.py`
- **Configuration tests use synthetic environments; never open a developer's .env.** (1 connections) — `tests/test_env_variables.py`
- **test_private_review_and_env_are_ignored()** (1 connections) — `tests/test_env_variables.py`

## Relationships

- [Site Build Logic](Site_Build_Logic.md) (4 shared connections)
- [HTML and PDF Parsing](HTML_and_PDF_Parsing.md) (1 shared connections)

## Source Files

- `tests/test_env_variables.py`

## Audit Trail

- EXTRACTED: 13 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*