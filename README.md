##Zone web service
このプロジェクトは、「外で作業したいけど理想的な場所を探すのに家で一日を過ごしてしまった」、そんなノマドやリモートワーカーを０にしようと立ち上がりました。
このシステムは皆様に最適な環境をおすすめすることで、作業場所を探す手間をたった数クリックに変えて見せます。
そこで私たちが作ろうと考えたのは、ノマドやリモートワーカーの力を合わせて全員が必要なものを作り上げるプラットホームです。

###本サービスの目的
* リモートワーカに最適な環境をおすすめする。

###対象ユーザー
* 作業場所を探すノマド・リモートワーカー


##使い方
###Top画面およびLogin
以下がtop画面となります。
右上のある、ナビゲーションバーのLoginから認証を通してください。（スーパーユーザで認証できます）
![top_login](https://github.com/Takatymo/Zone/wiki/README_images/login_top.png "top_login")

### システムからのレコメンド機能
ログイン後、	メインのアプリケーション画面に移動しユーザの好みに合わせた場所がおすすめされます。
**閉じる**か右上の**×**を押すとレコメンドwindowが閉じます。
![recommend](https://github.com/Takatymo/Zone/wiki/README_images/recommend.png "recommend")

### メインアプリケーション画面
登録されている場所がすべて左側のリストに表示されます。
また、上のナビゲーションバーにある検索フォームから場所を絞り込むことができます。
![map](https://github.com/Takatymo/Zone/wiki/README_images/search.png "map")

### 詳細画面
左側のリストから気になる場所をクリックするとその場所の詳細画面が表示されます。

* **「現在この場所にいる」**を押すとチェックインを行うことができます。チェックインをすることによってポイントを取得できます。このポイントはユーザから場所をおすすめする際に使えます。（その場所にいなかったり、その日に一度チェックインをしている場合はこの機能は使えません）
*  **「この場所をおすすめする」**を押すと、ユーザから場所のおすすめをする画面が表示されます。
![detail](https://github.com/Takatymo/Zone/wiki/README_images/detail.png "detail")

### ユーザからのおすすめ機能
おすすめする際はポイントと、その場所の良かったところを入力して**Save**を押してください。その後、おすすめした場所にポイントが加算されユーザのポイントは差し引かれます。
このお勧めはシステムからのレコメンドに影響されます。
![user_recommend](https://github.com/Takatymo/Zone/wiki/README_images/user_recommend.png "user_recommend")


##実行環境
* Windows 7
* Python 3.4.3
* Django 1.8.2
* PostgreSQL 9.4


###Pythonモジュール
* psycopg2==2.6（インストーラを使用）
* Pillow==2.8.2
* requests==2.7.0

###クライアントサイドライブラリ
* bootstrap
* bootbox
* jquery 2.1.4


##起動方法

Zone/Apps/Zone_app/setting.pyでデータベースの設定を行います。
psycopg2のインストールが必須です。

http://www.stickpeople.com/projects/python/win-psycopg/
以下はlocal環境におけるのpostgresqlの設定です。
```python
DATABASES = {
        'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'Zone',
        'USER': 'postgres',
        'PASSWORD': '*****',
        'HOST': 'localhost',
    }
}
```

以下のコマンドを実行してマイグレーションを行います。
```shell
$ python manage.py makemigrations
$ python manage.py migrate
```
スーパユーザを作成
usernameとpaswordの入力が必須となります。
```shell
$ python manage.py createsuperuser
```

サーバを起動
```shell
$ python manage.py runserver
```

ブラウザでhttp://127.0.0.1:8000/にアクセスします。

##初期データの登録
ブラウザでhttp://127.0.0.1:8000/adminにアクセスします。

### Place
更新予定

### Mood
更新予定

### Preference
更新予定

##画面
* TOP画面
* Map画面
* ユーザ登録画面

##機能
* ログイン/ログアウト
* ユーザ登録
* 地図機能
* 住所および場所から検索
* システムからのレコメンド機能
* ユーザからのおすすめ機能
* チェックイン機能（現在お店にいる）
