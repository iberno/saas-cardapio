CREATE USER saas_app WITH PASSWORD 'changeme';
CREATE USER saas_platform WITH PASSWORD 'changeme';
CREATE DATABASE saas_cardapio OWNER saas_app;
GRANT ALL PRIVILEGES ON DATABASE saas_cardapio TO saas_app;
GRANT ALL PRIVILEGES ON DATABASE saas_cardapio TO saas_platform;
