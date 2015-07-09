#!/usr/bin/env python
import os
import sys
import getopt
import cherrypy
import ConfigParser

from meals.plugin import SAEnginePlugin, SATool
from meals.controllers.day import DaysController
from meals.controllers.meal import MealsController
from meals.controllers.emailcontroller import EmailController
from meals.controllers.ingredient import IngredientsController

HERE = os.path.dirname(os.path.abspath(__file__))

def get_app():
    d = cherrypy.dispatch.RoutesDispatcher()

    d.connect(name='days', route='/api', controller=DaysController)
    d.connect(name='meals', route='/api', controller=MealsController)
    d.connect(name='email', route='/api', controller=EmailController)
    d.connect(name='ingredients', route='/api', controller=IngredientsController)

    with d.mapper.submapper(path_prefix='/api/v1', controller='email') as m:
        m.connect('send_email', '/email', action='send')
        
    with d.mapper.submapper(path_prefix='/api/v1', controller='meals') as m:
        m.connect('list_meals', '/meal', action='list_meals', conditions=dict(method=['GET']))
        m.connect('get_meal', '/meal/{meal_id}', action='get_meal', conditions=dict(method=['GET']))
        m.connect('update_meal', '/meal/{meal_id}', action='update_meal', conditions=dict(method=['PUT']))
        m.connect('add_meal', '/meal', action='add_meal', conditions=dict(method=['POST']))
        m.connect('delete_meal', '/meal/{meal_id}', action='delete_meal', conditions=dict(method=['DELETE']))

    with d.mapper.submapper(path_prefix='/api/v1', controller='days') as m:
        m.connect('list_days', '/day', action='list_days', conditions=dict(method=['GET']))
        m.connect('get_day', '/day/{day_id}', action='get_day', conditions=dict(method=['GET']))
        m.connect('update_day', '/day/{day_id}', action='update_day', conditions=dict(method=['PUT']))
        m.connect('delete_day', '/day/{day_id}', action='delete_day', conditions=dict(method=['DELETE']))

    with d.mapper.submapper(path_prefix='/api/v1', controller='ingredients') as m:
        m.connect('list_ingredients', '/ingredient', action='list_ingredients', conditions=dict(method=['GET']))
        m.connect('get_ingredient', '/ingredient/{ingredient_id}', action='get_ingredient', conditions=dict(method=['GET']))
        m.connect('update_ingredient', '/ingredient/{ingredient_id}', action='update_ingredient', conditions=dict(method=['PUT']))
        m.connect('add_ingredient', '/ingredient', action='add_ingredient', conditions=dict(method=['POST']))
        m.connect('delete_ingredient', '/ingredient/{ingredient_id}', action='delete_ingredient', conditions=dict(method=['DELETE']))

    server_cfg = {
        'server.socket_host': '0.0.0.0',
        'server.socket_port': 8080,
        'tools.db.on': True,
        'tools.gzip.on': True,
        'tools.gzip.mime_types': ["application/json"],
        'tools.staticdir.root': HERE+'/../'
    }

    cherrypy.config.update(server_cfg)
    
    config = {
        '/': {
            'request.dispatch': d
        },
        '/web': {
            'tools.staticdir.dir': 'static',
            'tools.staticdir.on': True,
            'tools.staticdir.index': 'index.html'            
        }
    }

    cherrypy.engine.autoreload.unsubscribe()
    app = cherrypy.tree.mount(root=None, config=config)
    return app

def start(config):
    app = get_app()
    
    connection_string = "mysql://%s:%s@%s/%s" % (
        config.get('mysql', 'user'),
        config.get('mysql', 'passwd'),
        config.get('mysql', 'host'),
        config.get('mysql', 'database')
    )

    SAEnginePlugin(cherrypy.engine, connection_string).subscribe()
    cherrypy.tools.db = SATool()

    EmailController.gmail_user = config.get('email', 'user')
    EmailController.gmail_pwd = config.get('email', 'password')
    
    cherrypy.engine.start()
    cherrypy.engine.block()
    cherrypy.quickstart(app)

    
if __name__ == '__main__':
    argv = sys.argv[1:]
    conf = None

    try:
        opts, args = getopt.getopt(argv, "hc:")
    except getopt.GetoptError:
        print 'Usage: server.py -c <configFile>'
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-h":
            print 'Usage: server.py -c <configFile>'
        elif opt == "-c":
            conf = arg

    if conf is None:
        print "Config file must be given. Usage: server.py -c <conf>'"
        sys.exit(2)

    c = ConfigParser.ConfigParser()
    c.readfp(open(conf))

    start(c)    
