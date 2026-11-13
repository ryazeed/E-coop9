"""End-to-end API tests for the PHP version. usage: python3 api_test.py http://127.0.0.1:8090"""
import sys, io, json, requests
BASE = sys.argv[1].rstrip('/')
PW = 'Coop@2026'
results = []

def check(name, cond, info=''):
    results.append((name, bool(cond), info)); print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else '  -> ' + str(info)[:300]))

class U:
    def __init__(self, email=None, pw=PW):
        self.s = requests.Session()
        if email: self.last = self.post('auth.php', op='login', email=email, password=pw)
    def post(self, path, **body):
        r = self.s.post(BASE + '/api/' + path, json=body); self.status = r.status_code
        try: return r.json()
        except Exception: return {'ok': False, 'error': r.text[:300]}
    def act(self, **a): return self.post('action.php', **a)
    def state(self): return self.s.get(BASE + '/api/state.php').json()

requests.post(BASE + '/install.php')                                     # fresh demo database

g = U(); st = g.state()
check('public state loads', st['ok'] and st['me'] is None and len(st['state']['users']) == 15)
check('public state has no codes / audit / notifications', not st['state']['codes'] and not st['state']['audit'] and not st['state']['notifs'])
check('no password hashes in state', 'password' not in json.dumps(st) and '$2y$' not in json.dumps(st))
r = g.post('auth.php', op='login', email='ahmed.almousa@jic.edu.sa', password='bad')
check('wrong password refused (TC-06)', r['code'] == 'wrong_password', r)
check('unknown e-mail refused', g.post('auth.php', op='login', email='nobody@x.sa', password=PW)['code'] == 'no_user')
check('suspended account refused', g.post('auth.php', op='login', email='turki.alanazi@jic.edu.sa', password=PW)['code'] == 'suspended')
for i in range(5): r = g.post('auth.php', op='login', email='hr@albahar-is.sa', password='nope')
check('5 wrong passwords lock the account', r['code'] == 'locked' and g.post('auth.php', op='login', email='hr@albahar-is.sa', password=PW)['code'] == 'locked', r)
check('action without sign-in -> 401', g.act(type='apply', opp='o4').get('code') == 'auth' and g.status == 401)

ahmed = U('ahmed.almousa@jic.edu.sa'); check('student signs in', ahmed.last['ok'] and ahmed.last['me'] == 'u1', ahmed.last)
check('student never receives daily codes', ahmed.last['state']['codes'] == [])
check('student only gets own notifications', all(n['user'] == 'u1' for n in ahmed.last['state']['notifs']) and ahmed.last['state']['notifs'])
east = U('coop@easternlogistics.sa'); gulf = U('training@gulfpetrochem.sa')
alrumi = U('abdullah.alrumi@jic.edu.sa'); mona = U('m.alghamdi@jic.edu.sa'); admin = U('coop.office@jic.edu.sa')
check('all roles sign in', all(x.last['ok'] for x in (east, gulf, alrumi, mona, admin)))

r = east.act(type='genCode', placement='p1'); code = [k for k in r['state']['codes'] if k['placement'] == 'p1' and k['status'] == 'Active']
check('company generates today\'s code (stored procedure)', r['ok'] and len(code) == 1 and len(code[0]['code']) == 6, r.get('error'))
code = code[0]['code']
r = east.act(type='genCode', placement='p1')
check('one code per placement per day (TC-28)', [k['code'] for k in r['state']['codes'] if k['status'] == 'Active'] == [code])
check('company cannot make a code for another company', east.act(type='genCode', placement='p2').get('code') == 'forbidden')
check('student sees no code after generation', ahmed.state()['state']['codes'] == [])

wrong = '000000' if code != '000000' else '111111'
r = ahmed.act(type='checkIn', code=wrong); check('wrong code refused', r['code'] == 'code_invalid', r)
r = ahmed.act(type='checkIn', code='107364'); check('old code refused as expired', r['code'] == 'code_expired', r)
r = ahmed.act(type='checkIn', code=code); check('correct code accepted (trigger BR-14/15)', r['ok'], r.get('error'))
mine = [a for a in r['state']['attendance'] if a['student'] == 's1' and a['date'] == r['today']]
check('attendance saved as Pending for today', len(mine) == 1 and mine[0]['status'] == 'Pending')
check('second check-in the same day refused (BR-16)', ahmed.act(type='checkIn', code=code)['code'] == 'code_duplicate')

abd = U('abdullah.alghamdi@jic.edu.sa')
check('no code yet -> code_none (or wrong code when the demo already has today\'s code)', abd.act(type='checkIn', code='123456')['code'] in ('code_none', 'code_invalid'))
gcode = [k['code'] for k in gulf.act(type='genCode', placement='p2')['state']['codes'] if k['status'] == 'Active'][0]
bad = '999999' if gcode != '999999' else '888888'
for i in range(5): r = abd.act(type='checkIn', code=bad)
check('5 wrong codes block check-in (TC-18)', r['code'] == 'code_locked', r)
check('blocked even with the right code', abd.act(type='checkIn', code=gcode)['code'] == 'code_locked')
check('student cannot use another placement\'s code', U('anas.alamri@jic.edu.sa').act(type='checkIn', code=gcode)['code'] in ('code_invalid', 'code_duplicate'))

att = [a['id'] for a in alrumi.state()['state']['attendance'] if a['student'] == 's1' and a['status'] == 'Pending']
r = alrumi.act(type='attDecision', ids=att, status='Approved'); check('supervisor approves attendance', r['ok'] and all(a['status'] == 'Approved' for a in r['state']['attendance'] if a['id'] in att), r.get('error'))
other = [a['id'] for a in alrumi.state()['state']['attendance'] if a['student'] == 's5' and a['status'] == 'Pending']
check('supervisor cannot approve another supervisor\'s student', alrumi.act(type='attDecision', ids=other[:1], status='Approved').get('code') == 'forbidden')
pend = [a['id'] for a in mona.state()['state']['attendance'] if a['student'] == 's5' and a['status'] == 'Pending']
r = mona.act(type='attDecision', ids=pend[:1], status='Rejected'); check('reject saves a comment (ck_att_reject_comment)', r['ok'] and [a for a in r['state']['attendance'] if a['id'] == pend[0]][0]['comment'], r.get('error'))

hind = U('hind.alzahrani@jic.edu.sa')
r = east.act(type='appDecision', id='a7', status='Accepted'); s = r['state']
check('company accepts (sp_accept_application)', r['ok'] and [a for a in s['apps'] if a['id'] == 'a7'][0]['status'] == 'Accepted', r.get('error'))
check('other pending application withdrawn (TC-25)', [a for a in s['apps'] if a['id'] == 'a8'][0]['status'] == 'Withdrawn')
check('student linked to the new placement', [x for x in s['students'] if x['id'] == 's7'][0]['placement'] is not None)
check('student notified of acceptance', any(n['key'] == 'nAppAccepted' for n in hind.state()['state']['notifs']))
check('decided application cannot change again', east.act(type='appDecision', id='a7', status='Rejected')['code'] == 'rule')
check('company cannot decide another company\'s application', gulf.act(type='appDecision', id='a8', status='Rejected')['code'] == 'forbidden')
check('placed student cannot apply (trigger UC-03)', hind.act(type='apply', opp='o2')['code'] == 'rule')

yaz = U('yazeed.alqahtani@jic.edu.sa')
r = yaz.act(type='apply', opp='o4'); check('student applies', r['ok'] and any(a['student'] == 's6' and a['opp'] == 'o4' for a in r['state']['apps']), r.get('error'))
check('one application per opportunity (BR-08)', yaz.act(type='apply', opp='o4')['code'] == 'duplicate')
check('cannot apply to a pending opportunity (trigger BR-07)', yaz.act(type='apply', opp='o5')['code'] == 'rule')
check('company cannot apply', east.act(type='apply', opp='o4')['code'] == 'forbidden')

r = east.act(type='postOpp', opp={'title': 'Warehouse Data Trainee', 'city': 'Dammam', 'majors': 'Business Administration, Computer Science', 'capacity': 2, 'description': 'Help with warehouse data.'})
new = [o for o in r['state']['opps'] if o['title'] == 'Warehouse Data Trainee']
check('company posts opportunity (Pending Approval, 2 majors)', r['ok'] and new and new[0]['status'] == 'Pending Approval' and new[0]['majors'] == 'Business Administration, Computer Science', r.get('error'))
check('admin notified of new opportunity', any(n['key'] == 'nOppNew' for n in admin.state()['state']['notifs']))
khob = U('careers@khobardigital.sa')
check('unapproved company cannot post (trigger BR-05)', khob.act(type='postOpp', opp={'title': 'Test Trainee', 'city': 'Khobar', 'majors': 'Computer Science', 'capacity': 1, 'description': 'x'})['code'] == 'rule')
check('capacity must be > 0', east.act(type='postOpp', opp={'title': 'Zero Seats', 'city': 'Dammam', 'majors': 'Computer Science', 'capacity': 0, 'description': 'x'})['code'] == 'validation')
r = admin.act(type='oppDecision', id=new[0]['id'], status='Open'); check('admin approves opportunity', [o for o in r['state']['opps'] if o['id'] == new[0]['id']][0]['status'] == 'Open', r.get('error'))
check('student cannot approve opportunities', yaz.act(type='oppDecision', id='o5', status='Open')['code'] == 'forbidden')
r = admin.act(type='companyDecision', id='c4', status='Approved'); check('admin approves company', [c for c in r['state']['companies'] if c['id'] == 'c4'][0]['status'] == 'Approved')
check('approved company can now post', khob.act(type='postOpp', opp={'title': 'Web Support Trainee', 'city': 'Khobar', 'majors': 'Computer Science', 'capacity': 1, 'description': 'Help desk.'})['ok'])

pdf = b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'
up = ahmed.s.post(BASE + '/api/upload.php', data={'key': 'ftest123'}, files={'file': ('Ahmed_Final_Report.pdf', io.BytesIO(pdf), 'application/pdf')}).json()
check('student uploads PDF', up['ok'], up)
fake = ahmed.s.post(BASE + '/api/upload.php', data={'key': 'ffake123'}, files={'file': ('virus.pdf', io.BytesIO(b'MZ not a pdf'), 'application/pdf')}).json()
check('fake PDF refused by content check', not fake['ok'], fake)
exe = ahmed.s.post(BASE + '/api/upload.php', data={'key': 'fexe1234'}, files={'file': ('a.exe', io.BytesIO(b'MZ'), 'application/octet-stream')}).json()
check('other file types refused (BR-17)', not exe['ok'])
r = ahmed.act(type='submitReport', file='Ahmed_Final_Report.pdf', fileKey='ftest123'); rep = [x for x in r['state']['reports'] if x['student'] == 's1']
check('report submitted', r['ok'] and rep and rep[0]['status'] == 'Submitted', r.get('error'))
key = rep[0]['fileKey']
check('student opens own report', ahmed.s.get(BASE + '/api/file.php?key=' + key).content.startswith(b'%PDF'))
check('own supervisor opens report', alrumi.s.get(BASE + '/api/file.php?key=' + key).status_code == 200)
check('other supervisor cannot open report', mona.s.get(BASE + '/api/file.php?key=' + key).status_code == 403)
check('other company cannot open report', gulf.s.get(BASE + '/api/file.php?key=' + key).status_code == 403)
check('seed report file opens', alrumi.s.get(BASE + '/api/file.php?key=r1').content.startswith(b'%PDF'))
check('storage folder not public', requests.get(BASE + '/storage/reports/demo_r1.pdf').status_code == 403)
check('config file not public', requests.get(BASE + '/api/config.php').text.strip() in ('', 'Forbidden'))
r = alrumi.act(type='reportDecision', id=rep[0]['id'], status='Request Revision'); check('supervisor requests revision', [x for x in r['state']['reports'] if x['id'] == rep[0]['id']][0]['status'] == 'Request Revision')
ahmed.s.post(BASE + '/api/upload.php', data={'key': 'ftest456'}, files={'file': ('Ahmed_v2.pdf', io.BytesIO(pdf), 'application/pdf')})
r = ahmed.act(type='submitReport', file='Ahmed_v2.pdf', fileKey='ftest456'); check('student resubmits after revision', [x for x in r['state']['reports'] if x['student'] == 's1'][0]['status'] == 'Submitted', r.get('error'))
r = alrumi.act(type='reportDecision', id=rep[0]['id'], status='Approved'); check('supervisor approves report', [x for x in r['state']['reports'] if x['id'] == rep[0]['id']][0]['status'] == 'Approved')

r = east.act(type='submitEval', student='s1', evalType='Company', score=90, comments='Great work on the stock counts.')
check('company evaluates its trainee', r['ok'] and any(e['student'] == 's1' and e['type'] == 'Company' for e in r['state']['evals']), r.get('error'))
check('second company evaluation refused (TC-30)', east.act(type='submitEval', student='s1', evalType='Company', score=80, comments='again')['code'] == 'duplicate')
check('company cannot evaluate another company\'s trainee', gulf.act(type='submitEval', student='s1', evalType='Company', score=80, comments='x')['code'] == 'forbidden')
r = alrumi.act(type='submitEval', student='s1', evalType='Academic', score=85, comments='Good.')
check('academic evaluation waits for completed placement (trigger UC-16)', r['code'] == 'rule' and 'UC-16' in r['error'], r)

check('admin cannot suspend self', admin.act(type='userStatus', id='u15', status='Suspended')['code'] == 'rule')
r = admin.act(type='userStatus', id='u3', status='Suspended'); check('admin suspends user', [u for u in r['state']['users'] if u['id'] == 'u3'][0]['status'] == 'Suspended')
check('suspended user cannot sign in (TC-40)', U().post('auth.php', op='login', email='omar.alghamdi@jic.edu.sa', password=PW)['code'] == 'suspended')
r = admin.act(type='assign', student='s6', supervisor='sup2'); check('admin assigns supervisor', [x for x in r['state']['students'] if x['id'] == 's6'][0]['supervisor'] == 'sup2')
check('audit log has the admin actions', any('Assigned Dr. Mona' in l['action'] for l in admin.state()['state']['audit']))
check('audit log readable text for procedures', any(l['action'].startswith('Accepted application from Hind') for l in admin.state()['state']['audit']))

reg = U()
check('student register needs college e-mail (TC-08)', reg.post('auth.php', op='register', kind='Student', name='Test Student', email='t@gmail.com', password='Passw0rd!', major='Computer Science', gpa='4')['code'] == 'email_domain')
r = reg.post('auth.php', op='register', kind='Student', name='Sara Test', email='sara.test@jic.edu.sa', password='Passw0rd1', phone='0551112223', major='Computer Science', gpa='4.1')
check('student registers and is signed in', r['ok'] and r['me'] and any(u['email'] == 'sara.test@jic.edu.sa' for u in r['state']['users']), r.get('error'))
check('new account can sign in with its password', U('sara.test@jic.edu.sa', 'Passw0rd1').last['ok'])
check('duplicate e-mail refused', U().post('auth.php', op='register', kind='Student', name='Sara Again', email='sara.test@jic.edu.sa', password='Passw0rd1', major='Computer Science')['code'] == 'email_taken')
r = U().post('auth.php', op='register', kind='Company', name='Jubail Test Factory', email='hr@jtf.sa', password='Passw0rd1', city='Jubail')
check('company registers as Pending Approval', r['ok'] and any(c['name'] == 'Jubail Test Factory' and c['status'] == 'Pending Approval' for c in r['state']['companies']), r.get('error'))
check('weak password refused', U().post('auth.php', op='register', kind='Company', name='Weak Co', email='a@b.sa', password='123', city='Jubail')['code'] == 'validation')

check('contact form works without sign-in', U().act(type='contact', msg={'name': 'Visitor', 'email': 'v@x.sa', 'topic': 'General', 'topicKey': 'general', 'msg': 'Hello'})['ok'])
r = ahmed.act(type='pref', key='summary', value=True); check('notification setting saved', r['state']['prefs'].get('u1:summary') is True)
r = ahmed.act(type='readNotifs'); check('notifications marked read', all(n['read'] for n in r['state']['notifs']))
check('export logged', admin.act(type='logExport', report='Institution', format='CSV')['ok'])
png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
r = ahmed.act(type='avatar', photo=png); av = [u for u in r['state']['users'] if u['id'] == 'u1'][0].get('avatar')
check('profile photo saved', r['ok'] and av and ahmed.s.get(BASE + '/' + av).status_code == 200, r.get('error'))
r = ahmed.act(type='profile', fields={'phone': '0551234000', 'gpa': '4.30', 'cv': 'Ahmed_CV.pdf'}, userFields={'name': 'Ahmed Abdulmohsen Almousa'})
check('student profile saved', [x for x in r['state']['students'] if x['id'] == 's1'][0]['gpa'] == '4.30', r.get('error'))
check('bad GPA refused (CHECK)', ahmed.act(type='profile', fields={'phone': '', 'gpa': '7', 'cv': ''}, userFields={'name': 'Ahmed'})['code'] == 'validation')
r = east.act(type='companyProfile', name='Eastern Logistics Co.', city='Dammam', phone='0138001201'); check('company profile saved (UC-07)', r['ok'], r.get('error'))
# ---------------------------------------------------------------- minimum GPA of an opportunity
yz = U('yazeed.alqahtani@jic.edu.sa')                                     # GPA 4.40, not placed
o8 = [o for o in yz.state()['state']['opps'] if o['id'] == 'o8'][0]
check('opportunity carries its minimum GPA', o8['minGpa'] == '4.50' and [o for o in yz.state()['state']['opps'] if o['id'] == 'o4'][0]['minGpa'] == '')
r = yz.act(type='apply', opp='o8'); check('GPA below the minimum cannot apply', r['code'] == 'gpa_low' and not [x for x in r['state']['apps'] if x['student'] == 's6' and x['opp'] == 'o8'], r)
r = east.act(type='postOpp', opp={'title': 'Finance Analyst Trainee', 'city': 'Dammam', 'majors': 'Business Administration', 'capacity': 1, 'minGpa': '4.40', 'description': 'Prepare monthly cost reports.'})
fin = [o for o in r['state']['opps'] if o['title'] == 'Finance Analyst Trainee']
check('company posts an opportunity with a minimum GPA', r['ok'] and fin and fin[0]['minGpa'] == '4.40', r.get('error'))
check('minimum GPA must be 0 to 5', east.act(type='postOpp', opp={'title': 'Bad GPA Trainee', 'city': 'Dammam', 'majors': 'Business Administration', 'capacity': 1, 'minGpa': '6', 'description': 'x'})['code'] == 'validation')
admin.act(type='oppDecision', id=fin[0]['id'], status='Open')
r = yz.act(type='apply', opp=fin[0]['id']); check('GPA equal to the minimum can apply', r['ok'], r.get('error'))
yz.act(type='profile', fields={'phone': '', 'gpa': '', 'cv': ''}, userFields={'name': 'Yazeed Mubarak Alqahtani'})
check('student without a GPA cannot apply when a minimum is set', yz.act(type='apply', opp='o7')['code'] == 'gpa_missing')
check('student without a GPA can apply when there is no minimum', yz.act(type='apply', opp=new[0]['id'])['ok'])

# ---------------------------------------------------------------- chat
anas = U('anas.alamri@jic.edu.sa'); a1 = U('ahmed.almousa@jic.edu.sa')
st = a1.state()['state']
check('chat: a user gets only own conversations', {c['id'] for c in st['chats']} == {'ch1', 'ch2', 'ch6'} and all(m['chat'] in ('ch1', 'ch2', 'ch6') for m in st['msgs']), [c['id'] for c in st['chats']])
check('chat: guest gets no conversations', g.state()['state']['chats'] == [] and g.state()['state']['msgs'] == [])
check('chat: admin does not see other people\'s conversations', {c['id'] for c in admin.state()['state']['chats']} == {'ch4'})
r = a1.act(type='sendMsg', chat='ch2', text='I will send the outline tomorrow.')
check('chat: member sends a message', r['ok'] and r['state']['msgs'][-1]['text'] == 'I will send the outline tomorrow.' and r['state']['msgs'][-1]['from'] == 'u1', r.get('error'))
def unread(u, chat):
    s = u.state()['state']; me = u.state()['me']; c = [x for x in s['chats'] if x['id'] == chat][0]
    return len([m for m in s['msgs'] if m['chat'] == chat and m['from'] != me and m['ts'] > c['lastRead']])
check('chat: the other member sees it as unread', unread(alrumi, 'ch2') == 1, unread(alrumi, 'ch2'))
alrumi.act(type='readChat', chat='ch2'); check('chat: opening the conversation marks it read', unread(alrumi, 'ch2') == 0)
check('chat: non-member cannot send', anas.act(type='sendMsg', chat='ch2', text='hi').get('code') == 'forbidden' and anas.status == 403)
check('chat: non-member cannot mark read', anas.act(type='readChat', chat='ch2').get('code') == 'forbidden')
check('chat: empty message refused', a1.act(type='sendMsg', chat='ch2', text='   ')['code'] == 'validation')
check('chat: message over 1000 characters refused', a1.act(type='sendMsg', chat='ch2', text='x' * 1001)['code'] == 'validation')
r = a1.act(type='sendMsg', chat='ch2', text='<script>alert(1)</script>'); check('chat: text is stored as plain text', r['ok'] and r['state']['msgs'][-1]['text'] == '<script>alert(1)</script>')
r = anas.act(type='newChat', user='u15'); new = [c for c in r['state']['chats'] if c['kind'] == 'direct' and set(c['members']) == {'u2', 'u15'}]
check('chat: start a new direct conversation', r['ok'] and len(new) == 1, r.get('error'))
r = anas.act(type='newChat', user='u15'); check('chat: one direct conversation per pair', len([c for c in r['state']['chats'] if set(c['members']) == {'u2', 'u15'}]) == 1)
check('chat: cannot message yourself', anas.act(type='newChat', user='u2')['code'] == 'validation')
check('chat: cannot message a suspended account', anas.act(type='newChat', user='u8')['code'] == 'rule')
check('chat: sign-in required', U().act(type='sendMsg', chat='ch1', text='hi').get('code') == 'auth')

check('logout ends the session', ahmed.post('auth.php', op='logout')['me'] is None and ahmed.act(type='readNotifs')['code'] == 'auth')

n = sum(1 for r in results if r[1]); print(f'\n{n} / {len(results)} passed')
json.dump(results, open('/tmp/php_api_results.json', 'w'))
