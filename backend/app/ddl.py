"""Print PostgreSQL DDL for the schema:  python -m app.ddl > schema.sql"""

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateIndex, CreateTable

from .models import Base

if __name__ == "__main__":
    dialect = postgresql.dialect()
    for table in Base.metadata.sorted_tables:
        print(str(CreateTable(table).compile(dialect=dialect)).strip() + ";\n")
        for index in sorted(table.indexes, key=lambda i: i.name or ""):
            print(str(CreateIndex(index).compile(dialect=dialect)).strip() + ";")
        print()
