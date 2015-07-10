import cherrypy

class DropboxController(object):

    def _upload_todo(self, body):
        f = open('todo.txt', 'w')
        f.write(body)
        f.close()

        f = open('todo.txt', 'rb')
        r = self.client.put_file('/todo/todo.txt', f, overwrite=True)
        return r

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def upload(self):
        data = cherrypy.request.json
        if 'body' in data:
            uploaded = self._upload_todo(data['body'])
            if uploaded:
                return {'uploaded': True}
            else:
                return {'uploaded': False}

        cherrypy.response.status = 400
        return {'sent': False, 'error': 'malformed request, request body must include body'}

