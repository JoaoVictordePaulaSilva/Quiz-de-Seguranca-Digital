# TecnoMack - Quiz de Segurança Digital 🔐

Um jogo educativo em HTML estático desenvolvido para alertar e instruir a população sobre os perigos presentes na internet e como se prevenir deles através de um quiz interativo.

## 📋 Características

- ✅ **Quiz Interativo**: 10 perguntas sobre segurança na internet e fake news
- 🎨 **Design Moderno**: Interface limpa e responsiva com as cores do protótipo
- 📱 **Responsivo**: Funciona em desktop, tablet e mobile
- 💾 **Sem Backend**: Totalmente estático - pode ser hospedado em GitHub Pages
- 🎯 **Feedback Educativo**: Cada resposta inclui uma explicação detalhada
- 📊 **Resultados Detalhados**: Estatísticas finais com dicas personalizadas
- 🎨 **Animações Suaves**: Transições visuais e animações CSS
- 🔀 **Ordem Aleatória**: Perguntas, alternativas e níveis aparecem em ordem embaralhada a cada tentativa
- 📥 **Base por CSV de Equipe**: O app lê automaticamente `perguntas.csv` versionado no projeto

## 🎮 Tópicos do Quiz

1. **Fake News** - O que é e como identificar
2. **Prevenção de Fake News** - Como evitar compartilhamento de informações falsas
3. **Phishing** - Entendendo ataques de phishing
4. **Senhas Fortes** - Como criar senhas seguras
5. **Emails Suspeitos** - Como identificar ataques por email
6. **WiFi Público** - Segurança em redes públicas
7. **Privacidade em Redes Sociais** - O que compartilhar ou não
8. **Identificação de Sites Falsos** - Como detectar phishing
9. **Proteção contra Cyberbullying** - Como se proteger online
10. **Atualizações de Software** - Por que são importantes

## 📁 Estrutura do Projeto

```
Projeto TecnoMack/
├── index.html          # Arquivo principal HTML
├── styles.css          # Estilos CSS (incluindo cores do protótipo)
├── script.js           # Lógica do quiz em JavaScript
├── quiz-data.js        # Dados das perguntas e respostas
├── perguntas.csv       # Banco principal de perguntas (editado pela equipe)
└── README.md           # Este arquivo
```

## 🚀 Como Usar Localmente

1. **Clone ou baixe o repositório**:
```bash
git clone https://github.com/seu-usuario/Projeto-TecnoMack.git
cd Projeto-TecnoMack
```

2. **Abra no navegador**:
   - Simplesmente clique em `index.html` ou
   - Use um servidor local (Python, Node.js, Live Server, etc.)

3. **Para um servidor local com Python**:
```bash
python -m http.server 8000
# Acesse: http://localhost:8000
```

## 🌐 Hospedagem no GitHub Pages

### Passo 1: Criar um repositório no GitHub

1. Vá para [github.com](https://github.com) e faça login
2. Clique em "New" para criar um novo repositório
3. Nomeie como `Projeto-TecnoMack` (ou qualquer nome desejado)
4. Deixe como Public
5. Clique em "Create repository"

### Passo 2: Fazer upload dos arquivos

**Opção A: Com Git (Recomendado)**
```bash
# Clone o repositório (vazio)
git clone https://github.com/seu-usuario/Projeto-TecnoMack.git
cd Projeto-TecnoMack

# Copie os arquivos para a pasta
# (ou faça git add, commit e push dos arquivos atuais)

git add .
git commit -m "Inicial - Quiz de Segurança Digital"
git push origin main
```

**Opção B: Upload direto no site**
1. Na página do repositório, clique em "Add file" > "Upload files"
2. Selecione todos os arquivos do projeto
3. Clique em "Commit changes"

### Passo 3: Ativar GitHub Pages

1. Vá para "Settings" do repositório
2. Na seção "Pages" (lado esquerdo)
3. Em "Source", selecione "Deploy from a branch"
4. Em "Branch", selecione "main" e "/root"
5. Clique em "Save"

### Passo 4: Acessar o site

Aguarde alguns minutos e acesse:
```
https://seu-usuario.github.io/Projeto-TecnoMack
```

## 🎨 Paleta de Cores

- **Azul Escuro**: `#2c3e7f` - Cor primária (como no protótipo)
- **Azul Claro**: `#5b7cc8` - Cor secundária
- **Roxo Escuro**: `#1a2450` - Fundo alternativo
- **Azul Claro 2**: `#6c9ef0` - Destacamentos
- **Verde**: `#2ecc71` - Acertos/Sucesso
- **Vermelho**: `#e74c3c` - Erros
- **Cinza Claro**: `#ecf0f1` - Fundo

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Grid, Flexbox, Gradientes, Animações
- **JavaScript (Vanilla)**: Lógica interativa sem dependências externas
- **Responsive Design**: Mobile-first approach

## ✨ Funcionalidades Principais

### Quiz Interativo
- Navegação entre perguntas
- Validação de respostas
- Feedback imediato com explicações

### Sistema de Pontuação
- 10 pontos por resposta correta
- Exibição de pontos em tempo real
- Cálculo de percentual final

### Banco de Perguntas por Excel/CSV
- O site continua 100% estático (compatível com GitHub Pages)
- A equipe pode criar/editar perguntas em planilha (Excel/Google Sheets)
- Exporte para `CSV UTF-8` e salve como `perguntas.csv`
- Coloque o arquivo na raiz do projeto e faça commit/push
- Em produção, o quiz lê esse arquivo automaticamente
- Se `perguntas.csv` estiver ausente ou inválido, o app usa `quiz-data.js` como fallback

### Tela de Resultados
- Exibição do score em círculo visual
- Classificação de desempenho
- Dicas personalizadas de segurança
- Opção de refazer o quiz

## 🔄 Fluxo de Conteúdo em Equipe

1. Time de pesquisa preenche uma planilha no formato definido abaixo
2. Exporte como `CSV UTF-8`
3. Renomeie para `perguntas.csv`
4. Substitua o arquivo na raiz do projeto
5. Faça commit e push
6. GitHub Pages publica automaticamente o novo banco

## 🧾 Formato do CSV (Excel)

Use exatamente estas colunas no cabeçalho:

```csv
level,question,option1,option2,option3,option4,correctOption,feedback1,feedback2,feedback3,feedback4
```

Exemplo de linha:

```csv
Intermediario,"Qual senha e mais segura?","123456","Data de nascimento","Senha longa com letras numeros e simbolos","Nome+123",3,"Fraca","Fraca","Correto!","Fraca"
```

Regras:
- `correctOption` deve ser `1`, `2`, `3` ou `4`
- Cada pergunta deve ter 4 opções
- Cada pergunta deve ter apenas 1 resposta correta
- `level` pode ser, por exemplo: `Iniciante`, `Intermediario` ou `Avancado`

## 📱 Compatibilidade

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📝 Licença

Este projeto é de código aberto e pode ser utilizado livremente para fins educacionais.

## 👥 Contribuições

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir novas perguntas
- Melhorar o design
- Traduzir para outros idiomas

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os arquivos estão no mesmo diretório
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Tente em outro navegador
4. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ para educação em segurança digital**

Versão 1.0 - 2026
