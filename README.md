# Cateira e extrator de dados da CEI B3


#### Extraindo e processando os dados

  *No diretório `server`*

```sh
yarn extract
```

Atualizando preços em tempo real (a cada 5 minutos):
```sh
yarn get-prices
```

#### Executando o client

*No diretório `client`*

```sh
yarn start
```

- Utiliza o Puppeteer para acessar o site da CEI B3
- Loga, extrai os dados e gera um arquivo JSON com o resultado

### TODO

- Posição por corretora
- Posição consolidada
- Apuração de negociações para fins de IR

### TODO - Será que rola?

- Acesso ao site da corretora para coletar notas
- Leitura de notas de corretagem para apuração

**Work in progress!**