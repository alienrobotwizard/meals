import jwt
import cherrypy
from datetime import datetime
from datetime import timedelta
from meals.model import User

log = cherrypy.log

class UsersController(object):

    @staticmethod
    def valid_token(token):
        try:
            payload = jwt.decode(token, UsersController.secret, algorithms=['HS256'])
            return True if payload else False
        except Exception as e:
            return False
        
    def _make_token(self, email):        
        return jwt.encode({
            'user':email,
            'exp': datetime.utcnow() + timedelta(seconds=3600)
        }, self.secret, algorithm='HS256')
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def authenticate(self):
        data = cherrypy.request.json
        if 'user' in data and all(k in data['user'] for k in User.required_fields):
            email = data['user']['email']
            password = data['user']['password']
            if User.authenticate(cherrypy.request.db, email, password):
                token = self._make_token(email)
                cherrypy.response.cookie['access_token'] = token
                # cherrypy.response.cookie['access_token']['Secure'] = True
                cherrypy.response.cookie['access_token']['HttpOnly'] = True
                cherrypy.response.cookie['access_token']['path'] = '/'
                return {'access_token': token}
            else:
                cherrypy.response.status = 401
                return {'error': 'invalid credentials'}

        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include user data with {}'.format(User.required_fields)}
