import os

# https://github.com/yarnpkg/yarn/issues/4546
if not os.getenv('https_proxy'):
    os.environ.pop('http_proxy')

__import__('setuptools').setup()
