#!/usr/bin/env python
import os
import sys
import getopt
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from meals.model import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_engine():
    return create_engine(os.environ.get('DATABASE_URL'), echo=False)

def get_session(engine):    
    sess = scoped_session(sessionmaker(autoflush=True,
                                       autocommit=False))
    sess.configure(bind=engine)
    return sess
            
def init_db(engine=None):
    if not engine:
        engine = get_engine()
        
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
def init_db_once():
    engine = get_engine()
    if not Meal.__table__.exists(engine):
        init_db(engine=engine)

def update_metadata():
    Base.metadata.create_all(get_engine())

if __name__ == '__main__':
    argv = sys.argv[1:]
    force = None
    metadata_only = None
    
    try:
        opts, args = getopt.getopt(argv, "hc:f:m:")
    except getopt.GetoptError:
        print 'Usage: initdb.py'
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-h":
            print 'Usage: initdb.py'
        elif opt == "-f":
            force = arg
        elif opt == "-m":
            metadata_only = arg 

    if force and force == 'true':
        logging.info("Forcing database refresh...all data will need to be reloaded")
        init_db()
    elif metadata_only and metadata_only == 'true':
        logging.info("Updating database schema metadata")
        update_metadata()
    else:
        logging.info("Initializing new database")
        init_db_once()
