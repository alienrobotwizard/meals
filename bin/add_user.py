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
            
if __name__ == '__main__':
    argv = sys.argv[1:]
    email = None
    pw = None
    
    try:
        opts, args = getopt.getopt(argv, "hc:u:p:")
    except getopt.GetoptError:
        print 'Usage: add_user.py -u <user> -p <password>'
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-h":
            print 'Usage: add_user.py -u <user> -p <password>'
        elif opt == "-u":
            email = arg
        elif opt == "-p":
            pw = arg 

    if email is None:
        print "User's email must be given. Usage: add_user.py -u <user_email> -p <password>"
        sys.exit(2)
        
    if pw is None:
        print "User's password must be given. Usage: add_user.py -u <user_email> -p <password>"
        sys.exit(2)

    db = get_session(get_engine())
    u = User.create(db, email, pw)
    if not u:
        logger.warn("User already exists")
    db.commit()
