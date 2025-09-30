# Generating DB

import os
from urllib.parse import quote_plus
from databases import Database
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv
from tables import Base, User, Document, Chat, Message

# Load environment variables from .env file
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# URL encode password to handle special characters
encoded_password = quote_plus(DB_PASSWORD)

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
database = Database(DATABASE_URL, ssl=True)  

engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    connect_args={
        "ssl": {
            "ssl_verify_cert": True,
            "ssl_verify_identity": True
        }
    },
    echo=False
)

metadata = MetaData()

Base.metadata.create_all(bind=engine)