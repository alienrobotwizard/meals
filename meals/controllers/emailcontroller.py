import smtplib
import cherrypy

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.MIMEBase import MIMEBase
from email.utils import COMMASPACE, formatdate
from email import Encoders

class EmailController(object):

    def _send_email(self, to, ics_content):
        receivers = [to]

        msg = MIMEMultipart()
        msg['From'] = self.gmail_user
        msg['To'] = COMMASPACE.join(receivers)
        msg['Date'] = formatdate(localtime=True)
        msg['Subject'] = 'Shopping List'
        
        msg.attach(MIMEText("The shopping list."))
        part = MIMEBase('text', 'calendar')
        part.set_payload(ics_content)
        part.add_header('Content-Disposition', 'attachment; filename="shopping_list.ics"')
        
        msg.attach(part)
        
        try:
            server = smtplib.SMTP_SSL()
            server.connect('smtp.gmail.com', 465)
            server.login(self.gmail_user, self.gmail_pwd)
            server.sendmail(self.gmail_user, receivers, msg.as_string())
            server.quit()
            return True
        except:
            return False
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def send(self):
        data = cherrypy.request.json
        if 'email' in data and 'body' in data: 
            return {'sent': self._send_email(data['email'], data['body'])}

        cherrypy.response.status = 400
        return {'sent': False, 'error': 'malformed request, request body must include email and body'}
