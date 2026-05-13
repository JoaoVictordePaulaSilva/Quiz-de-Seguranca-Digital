# TecnoMack - Quiz de Segurança Digital 🔐

Um jogo educativo em HTML estático desenvolvido para alertar e instruir a população sobre os perigos presentes na internet e como se prevenir deles através de um quiz interativo com sistema avançado de relatórios e análise de desempenho.

## 📋 Características

### Quiz
- ✅ **Quiz Interativo**: 10 perguntas sobre segurança na internet e fake news
- 🎨 **Design Moderno**: Interface limpa e responsiva com as cores do protótipo
- 📱 **Responsivo**: Funciona em desktop, tablet e mobile
- 💾 **Sem Backend**: Totalmente estático - pode ser hospedado em GitHub Pages
- 🎯 **Feedback Educativo**: Cada resposta inclui uma explicação detalhada
- 🔀 **Ordem Aleatória**: Perguntas, alternativas e níveis aparecem em ordem embaralhada a cada tentativa
- 📥 **Perguntas Dinâmicas**: O app lê `perguntas.csv` para carregar questões

### Sistema de Dicas
- 💡 **50/50 - Eliminar 2**: Remove duas alternativas erradas
- ⏭️ **Pular Questão**: Passa para a próxima pergunta
- 👨‍🎓 **Universitários**: Sugestão que pode ajudar ou não

### Relatórios & Analytics
- 📊 **Relatório Integrado**: Visualize desempenho de todos os participantes
- 📈 **Gráficos Interativos**: Média de acertos e taxa de aprovação por dificuldade
- 💾 **Exportar Relatórios**: Baixe em PDF ou JSON
- 📥 **Importar Relatórios**: Carregue JSONs de relatórios anteriores
- 🎯 **Comparativo por Dificuldade**: Analise desempenho por nível (Iniciante/Intermediário/Avançado)
- 📊 **Uso de Dicas**: Rastreamento de quantas vezes cada dica foi utilizada
- ❌ **Questões Mais Erradas**: Identifique tópicos problemáticos
- ✅ **Taxa de Aprovação**: Acompanhe quantos atingiram 70%+

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
├── index.html                          # Arquivo principal (quiz + relatórios)
├── styles.css                          # Estilos CSS (cores, layouts, gráficos)
├── script.js                           # Lógica principal (quiz, relatórios, analytics)
├── quiz-data.js                        # Dados padrão das perguntas (fallback se CSV ausente)
├── perguntas.csv                       # Banco de perguntas editável (CSV UTF-8)
├── reports/                            # Dados de relatórios persistidos
│   ├── reports_manifest.json           # Mapeamento dos JSONs individuais
│   └── individual/                     # Arquivo JSON individual por relatório
│       ├── Relatorio_TecnoMack_*.json  # (8 relatórios de exemplo)
│       └── ...
├── .gitignore                          # Arquivos ignorados pelo git
└── README.md                           # Este arquivo
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
- **CSS3**: Grid, Flexbox, Gradientes, Animações, Gráficos CSS
- **JavaScript (Vanilla)**: Lógica interativa sem dependências externas
- **jsPDF**: Geração de PDFs no cliente (inclusão opcional)
- **LocalStorage**: Persistência de relatórios no navegador
- **JSON**: Formato de dados para relatórios

## ✨ Funcionalidades Principais

### Quiz Interativo
- Navegação entre perguntas com progresso visual
- Validação de respostas em tempo real
- Feedback imediato com explicações detalhadas
- Sistema de dicas (50/50, Pular, Universitários)

### Sistema de Pontuação
- 10 pontos por resposta correta
- Exibição de pontos em tempo real
- Cálculo de percentual final
- Classificação de desempenho (Excelente/Bom/Razoável/Precisa melhorar)

### Tela de Resultados
- Exibição do score em círculo visual animado
- Feedback personalizado conforme desempenho
- Dicas de segurança customizadas
- Opção de refazer o quiz ou visualizar relatório

### Sistema de Relatórios
- **Tela de Relatórios Integrada**: Acesse de qualquer tela do quiz
- **KPIs em Destaque**: Total de participantes, média geral, aprovados, taxa de aprovação, perfeitos, menor pontuação
- **Gráficos por Dificuldade**: Compare média de acertos e taxa de aprovação (Iniciante/Intermediário/Avançado)
- **Pontuação por Participante**: Barra de progresso visual com scores ordenados
- **Uso de Dicas**: Rastreamento de dicas (50/50, Pular, Universitários)
- **Questões com Mais Erros**: Top 5 perguntas que mais falharam
- **Exportar em PDF**: Download completo do relatório
- **Exportar em JSON**: Salve sessão para compartilhamento/análise
- **Importar JSON**: Carregue relatórios anteriores no navegador

### Banco de Perguntas por CSV
- O site continua 100% estático (compatível com GitHub Pages)
- A equipe pode criar/editar perguntas em planilha (Excel/Google Sheets)
- Exporte para `CSV UTF-8` e salve como `perguntas.csv`
- Coloque o arquivo na raiz do projeto e faça commit/push
- Se `perguntas.csv` estiver ausente, o app usa `quiz-data.js` como fallback

## 🔄 Fluxo de Conteúdo em Equipe

1. Time de pesquisa preenche uma planilha no formato definido abaixo
2. Exporte como `CSV UTF-8`
3. Renomeie para `perguntas.csv`
4. Substitua o arquivo na raiz do projeto
5. Faça commit e push
6. GitHub Pages publica automaticamente o novo banco

## 📊 Como Usar os Relatórios

### Na Tela de Resultados
1. Clique em **"Ver Relatório"** após finalizar o quiz
2. Visualize os KPIs principais no topo
3. Analise a pontuação de cada participante
4. Veja o comparativo por dificuldade com gráficos animados
5. Identifique as dicas mais usadas
6. Revise as questões com mais erros

### Exportar Relatório
- Clique em **"Baixar Relatório em PDF"** para um arquivo PDF completo
- Clique em **"Gerar JSON"** para salvar os dados da sessão atual em formato JSON

### Importar Relatórios
1. Na tela de Relatórios, clique em **"Importar Relatório (JSON)"**
2. Selecione um arquivo JSON previamente exportado
3. Os dados serão carregados e integrados ao histórico
4. Os gráficos atualizarão automaticamente

### Limpar Histórico
- Clique em **"Limpar Todos"** para remover todos os relatórios salvos (use com cuidado!)

## 💾 Persistência de Dados

### localStorage
- Relatórios são salvos automaticamente no `localStorage` do navegador
- Chave utilizada: `tecnomack_reports_v1`
- Dados persistem enquanto o navegador não limpar o cache
- Cada navegador/máquina tem seu próprio histórico

### JSON no Servidor (reports/)
- O arquivo `reports/reports_manifest.json` mapeia JSONs individuais
- Cada JSON em `reports/individual/` contém dados de um relatório
- Estes arquivos são versionados e incluídos no git para persistência em produção
- Ao carregar o site, o frontend carrega estes JSONs automaticamente

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

## � Arquivos Críticos vs Opcionais

### ✅ Críticos (o site NÃO funciona sem)
- `index.html` - Estrutura principal
- `script.js` - Lógica de quiz e relatórios
- `styles.css` - Estilos e layout
- `quiz-data.js` - Dados de fallback
- `perguntas.csv` OU dados padrão em `quiz-data.js`

### 📁 Dependências (persistência de dados)
- `reports/reports_manifest.json` - Mapeamento de JSONs
- `reports/individual/*.json` - Dados de relatórios (8 de exemplo inclusos)

### ℹ️ Informativos
- `README.md` - Esta documentação
- `.gitignore` - Configuração git

## 🎯 O que há de novo na v2.0

- ✨ **Sistema de Relatórios Integrado**: Visualize análise completa de desempenho
- 📊 **Gráficos Interativos**: Compare médias e aprovação por dificuldade com animações
- 💾 **Export/Import JSON**: Salve e carregue sessões de relatórios
- 📋 **Manifest de Relatórios**: Suporte a múltiplos JSONs individuais
- 🎨 **Gráficos CSS**: Barras animadas sem dependências externas
- 🔄 **Rastreamento de Dicas**: Análise de uso de cada tipo de dica
- ❌ **Top Erros**: Identifique as questões mais problemáticas
- 📈 **KPIs Detalhados**: 6 métricas principais em destaque

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Opcional: Python ou Node.js para servir localmente

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/JoaoVictordePaulaSilva/Quiz-de-Seguranca-Digital.git
cd "Projeto TecnoMack"
```

2. Abra no navegador:
   - Duplo-clique em `index.html`, ou
   - Use um servidor local:

```bash
# Com Python 3
python -m http.server 8000

# Com Python 2
python -m SimpleHTTPServer 8000

# Com Node.js (com http-server instalado)
npx http-server
```

3. Acesse: `http://localhost:8000`

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

Versão 2.0 - 2026 (Com sistema de relatórios e gráficos de analytics)
