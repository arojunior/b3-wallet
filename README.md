# Cateira e extrator de dados da CEI/B3

> :warning: **Este projeto não está mais sendo mantido**: A B3 fez várias alterações no portal do investidor e seria necessário reescrever todo o código do coletor de dados, então decidi abandonar o projeto

```sh
yarn start
```

- Utiliza o Puppeteer para acessar o site da CEI/B3 (Canal Eletrônico do Investidor)
- Loga, extrai os dados e gera um arquivo JSON com o resultado
- Client em React
- Server NodeJs puro com Socket.io
- Tudo empacotado em uma aplicação Electron

### TODO

- Posição por corretora
- Posição consolidada
- Apuração de negociações para fins de IR

### TODO - Será que rola?

- Acesso ao site da corretora para coletar notas
- Leitura de notas de corretagem para apuração

**Work in progress!**

## LICENSE
Non-Profit Open Software License version 3.0 (NPOSL-3.0)
https://opensource.org/licenses/NPOSL-3.0