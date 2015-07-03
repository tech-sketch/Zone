from django.test import TestCase
from .models import NomadUser

# Create your tests here.
class AuthorizationTestCase(TestCase):
    def setUp(self):
        nomad = NomadUser.objects.create(username='user1', password='1111')
        nomad.set_password(nomad.password)
        nomad.save()
        self.user_to_login = {'username': 'user1', 'password': '1111'}
        self.user_not_to_login = {'username': 'user1', 'password': '2222'}

    def test_login(self):
        response = self.client.post('/login/', self.user_not_to_login, follow=True)
        print(response.redirect_chain)
        self.assertNotIn('_auth_user_id', self.client.session)
        response = self.client.post('/login/', self.user_to_login, follow=True)
        print(response.redirect_chain[0][0])
        self.assertIn('_auth_user_id', self.client.session)

class ScreenTransitionTestCase(TestCase):
    def setUp(self):
        nomad = NomadUser.objects.create(username='user1', password='1111')
        nomad.set_password(nomad.password)
        nomad.save()
        self.user_to_login = {'username': 'user1', 'password': '1111'}

    def test_ScreenTransition_before_login(self):
        pass

