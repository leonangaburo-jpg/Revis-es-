# Plano de Estudos — Praticante de Prático

PWA de ciclo de aprendizagem com repetição espaçada. Videoaula → leitura → dúvidas → flashcards → simulado. Revisões automáticas (R1 / R2 / R3) geradas ao concluir cada capítulo.

Funciona 100% offline após a primeira carga. Sem servidor, sem login, sem rastreamento. Todos os dados ficam no próprio dispositivo.

## Conteúdo do pacote

```
estudo-pwa/
├── index.html              ← App principal (HTML + CSS + JS, single-file)
├── manifest.json           ← Metadados do PWA (nome, ícone, cores)
├── sw.js                   ← Service Worker (cache offline)
├── icon-192.png            ← Ícone 192x192
├── icon-512.png            ← Ícone 512x512 (splash + alta densidade)
├── icon-maskable-512.png   ← Ícone Android adaptive
└── README.md               ← Este arquivo
```

---

## Hospedagem no GitHub Pages

### Importante: use um repositório SEPARADO do Pomodoro

Cada PWA precisa do próprio repositório (próprio escopo, próprio service worker). Não misture os dois no mesmo repo — causaria conflito de cache.

### Passo a passo

**1. Criar um repositório novo**
- Acesse https://github.com/new
- Nome: `estudos` (ou similar, sem espaços nem acentos)
- Marque **Public**
- Marque **Add a README file**
- Clique em **Create repository**

**2. Subir os arquivos**
- Descompacte o `estudo-pwa.zip` no seu computador
- Na página do repositório, clique em **Add file → Upload files**
- Abra a pasta `estudo-pwa` descompactada e **arraste os 7 arquivos individuais** (não a pasta inteira) para a área de upload:
  - `index.html`
  - `manifest.json`
  - `sw.js`
  - `icon-192.png`
  - `icon-512.png`
  - `icon-maskable-512.png`
  - `README.md` (substitui o gerado automaticamente)
- Role para baixo → **Commit changes**

**3. Ativar GitHub Pages**
- **Settings** (engrenagem no topo) → **Pages** (menu lateral)
- **Source**: Deploy from a branch
- **Branch**: `main` + `/ (root)` → **Save**
- Aguarde 1–2 minutos → URL fica disponível em:
  ```
  https://SEU-USUARIO.github.io/estudos/
  ```

**4. Conferir se ficou certo**

Na página principal do repositório, os arquivos devem aparecer **soltos na raiz**:

```
📄 README.md
📄 index.html       ← essencial
📄 manifest.json
📄 sw.js
🖼 icon-192.png
🖼 icon-512.png
🖼 icon-maskable-512.png
```

Se aparecer uma pasta 📁 `estudo-pwa`, os arquivos estão aninhados incorretamente. Refazer upload dos arquivos soltos (ou apagar o repo e recomeçar).

**5. Instalar no dispositivo**
- **iOS (iPhone/iPad):** abra a URL no Safari → Compartilhar → **Adicionar à Tela de Início**
- **Android:** abra no Chrome → banner "Instalar app" aparecerá automaticamente
- **Desktop:** ícone de instalação na barra de endereços (Chrome/Edge)

**6. Atualizações futuras**
- Edite qualquer arquivo direto no GitHub (ícone de lápis) → Commit
- O service worker detecta a nova versão e mostra um toast no app: *"Nova versão disponível — toque para atualizar"*
- Caso queira forçar atualização: incremente a constante `VERSION` no `sw.js` (ex.: `estudo-v1.0.0` → `estudo-v1.0.1`)

---

## Riscos de cibersegurança

Mesmo perfil do Pomodoro (app 100% client-side, sem servidor), **mas com uma diferença importante:** este app tem **entrada de texto livre** (nome de capítulo). Isso acrescenta um vetor que o Pomodoro não tinha.

### Riscos reais (mitigados no código)

**1. XSS (Cross-Site Scripting) via nome de capítulo — mitigado**
- *Risco original:* a versão anterior injetava `ch.name` direto em `innerHTML`. Um capítulo nomeado `<script>alert(1)</script>` executaria código na própria página. Embora o usuário só prejudicasse a si mesmo, o risco ficava real ao compartilhar arquivo exportado.
- *Mitigação implementada:* toda inserção de dados do usuário no DOM agora passa pela função `esc()` que escapa os 5 caracteres perigosos (`& < > " '`). São 13 pontos de escape distribuídos pelo código.
- *CSP (Content Security Policy) no `<head>`:* segunda linha de defesa — bloqueia execução de scripts de domínios não autorizados.

**2. Importação de arquivo JSON malicioso — mitigado**
- *Risco:* um colega bem-intencionado pode enviar um arquivo exportado que, propositalmente ou por corrupção, contenha dados maliciosos.
- *Mitigação implementada:* a importação valida cada campo (tipo, formato de data com regex, tamanho). Arquivos acima de 5MB são rejeitados. Payloads com tags HTML são escapados antes de renderizar.
- *Sua responsabilidade:* só importe arquivos `.json` que você mesmo exportou ou de fonte confiável.

**3. Comprometimento da conta GitHub (supply-chain) — principal risco externo**
- *Risco:* se sua conta GitHub for invadida, um atacante pode substituir o `sw.js` por versão maliciosa. Uma vez instalado no dispositivo do usuário, o service worker controla **todas** as requisições do app.
- *Mitigação #1 (essencial):* **habilite 2FA na conta GitHub** — GitHub → Settings → Password and authentication → enable 2FA.
- *Mitigação #2:* prefira 2FA com app autenticador (Authy, Google Authenticator) em vez de SMS, que é mais vulnerável a SIM swap.

### Riscos teóricos (baixa probabilidade neste caso)

**4. localStorage não é criptografado**
- O histórico de estudos fica em `localStorage` em texto puro.
- *Por que não é problema aqui:* os dados são nomes de capítulos do seu curso de Praticante de Prático, progresso de etapas e datas de revisão. Não há nada sensível — mesmo se alguém acessar fisicamente seu dispositivo, o "vazamento" é saber quais capítulos você estudou.
- *Quando seria problema:* se o app armazenasse notas privadas, dados médicos ou financeiros. Aí sim, Web Crypto API para criptografia client-side faria sentido.

**5. Quota de localStorage cheia**
- Cada domínio tem limite de ~5-10MB no `localStorage`. Se encher, o app não consegue mais salvar.
- *Mitigação implementada:* o código detecta `QuotaExceededError` e avisa via toast. Exportar os dados antes de limpar resolve.
- *Probabilidade real:* baixíssima — um uso intenso por anos dificilmente passa de 100KB.

**6. Dependência de Google Fonts**
- Fraunces e DM Mono vêm de `fonts.googleapis.com`. O Google em tese consegue ver cada acesso ao app.
- *Mitigação implementada:* o service worker cacheia as fontes na primeira visita — depois disso, são servidas localmente do cache. Sem novas requisições ao Google.
- *Mitigação extra (opcional):* baixar os `.woff2` e servir do próprio repositório, removendo totalmente a dependência externa.

### Riscos NÃO presentes neste app

- ❌ SQL Injection — não há banco de dados.
- ❌ CSRF — não há ações autenticadas no servidor.
- ❌ Vazamento de credenciais / API keys — não existem credenciais no app.
- ❌ Phishing por subdomínio — `github.io` é controlado pela GitHub com HTTPS válido.
- ❌ Session hijacking — não há sessão.

### Resumo prático

Para uso pessoal, perfil de risco **muito baixo**. Duas ações que importam de verdade:

1. **Habilitar 2FA na conta GitHub** (defesa de maior valor, 5 minutos).
2. **Não importar arquivos `.json` de fontes desconhecidas.**

Tudo o mais é acadêmico para este caso de uso.

---

## Manutenção

- **Backup regular:** use o botão **Exportar** dentro do app. O arquivo gerado é `estudo-dados-YYYY-MM-DD.json`. Salve no iCloud Drive/Google Drive para não depender do `localStorage` do navegador (que pode ser limpo por acidente).
- **Sincronizar entre dispositivos:** exportar em um → importar no outro. O merge é por nome de capítulo (case-insensitive) — não cria duplicatas.
- **Atualizar o app:** edite os arquivos no GitHub e faça commit. Próxima abertura do app aplicará a nova versão automaticamente.
- **Se algo travar:** desinstalar o PWA e reinstalar limpa cache e service worker. Os dados do `localStorage` são preservados desde que você continue usando o mesmo navegador/domínio.

## Licença

Uso pessoal livre. Sinta-se à vontade para customizar.
