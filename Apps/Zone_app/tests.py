from django.test import TestCase
from django.test.client import RequestFactory
from django.contrib.messages import add_message, get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from .models import NomadUser, Place

# Create your tests here.
class AuthorizationTestCase(TestCase):
    def setUp(self):
        nomad = NomadUser.objects.create(username='user1', password='1111')
        nomad.set_password(nomad.password)
        nomad.save()
        self.user_to_login = {'username': 'user1', 'password': '1111'}
        self.user_not_to_login = {'username': 'user1', 'password': '2222'}

    def test_login_logout(self):
        response = self.client.post('/login/', self.user_not_to_login)
        self.assertNotIn('_auth_user_id', self.client.session)
        self.assertTemplateUsed(response, 'login.html')
        self.assertContains(response, 'Your username and password didn\'t match. Please try again.')

        response = self.client.post('/login/', self.user_to_login, follow=True)
        self.assertIn('_auth_user_id', self.client.session)
        self.assertRedirects(response, '/maps/', status_code=302, target_status_code=200)

        response = self.client.get('/logout/', follow=True)
        self.assertNotIn('_auth_user_id', self.client.session)
        self.assertRedirects(response, '/', status_code=302, target_status_code=200)

class MessageTestCase(TestCase):
    def setUp(self):
        user = NomadUser.objects.create_user(username='user1', password='1111')
        self.placeid = Place.objects.create(nomad=user, name='place1').pk

    def test_get_correct_message(self):
        response = self.client.get('/detail/'+str(self.placeid))
        messages = list(response.context['messages'])
        self.assertIs(len(messages), 1)
        self.assertEqual(str(messages[0]), 'チェックイン・おすすめ機能を使うにはログインが必要です。')

        self.client.login(username='user1', password='1111')
        response = self.client.get('/detail/'+str(self.placeid))
        messages = list(response.context['messages'])
        self.assertIs(len(messages), 0)

class ScreenTransitionTestCase(TestCase):
    def setUp(self):
        nomad = NomadUser.objects.create(username='user1', password='1111')
        nomad.set_password(nomad.password)
        nomad.save()
        self.user_to_login = {'username': 'user1', 'password': '1111'}

    def test_ScreenTransition_before_login(self):
        pass
