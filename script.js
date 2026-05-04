// Quiz Logic
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let answeredQuestions = new Set();
let quizInProgress = false;
let activeQuizData = [];
let quizSessionData = [];
let selectedDifficulty = 'Misto'; // Default difficulty
let activeQuestionBankSource = 'csv';
let activeQuestionBankErrorMessage = '';
let dataSourceBannerHideTimer = null;
let eliminatedOptionsByQuestion = [];
let hintsUsage = {
    fifty: false,
    skip: false,
    university: false
};
let universitySuggestionByQuestion = {};

function shuffleArray(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function normalizeLevel(level) {
    const value = (level || '').toString().trim().toLowerCase();
    if (!value) return 'Intermediário';
    if (value.startsWith('ini') || value === 'easy') return 'Iniciante';
    if (value.startsWith('ava') || value === 'hard') return 'Avançado';
    if (value.startsWith('int') || value === 'medium') return 'Intermediário';
    return level.toString().trim();
}

function normalizeQuestion(question, index) {
    return {
        id: question.id || index + 1,
        level: normalizeLevel(question.level),
        question: (question.question || '').toString().trim(),
        options: (question.options || []).map(option => ({
            text: (option.text || '').toString().trim(),
            correct: Boolean(option.correct),
            feedback: (option.feedback || '').toString().trim()
        }))
    };
}

function validateQuestionBank(questionBank) {
    if (!Array.isArray(questionBank) || questionBank.length === 0) {
        throw new Error('O banco de perguntas está vazio.');
    }

    questionBank.forEach((question, index) => {
        if (!question.question) {
            throw new Error(`A pergunta ${index + 1} está sem enunciado.`);
        }
        if (!Array.isArray(question.options) || question.options.length < 2) {
            throw new Error(`A pergunta ${index + 1} precisa ter ao menos 2 opções.`);
        }
        const correctCount = question.options.filter(option => option.correct).length;
        if (correctCount !== 1) {
            throw new Error(`A pergunta ${index + 1} precisa ter exatamente 1 alternativa correta.`);
        }
    });
}

function detectCsvDelimiter(csvText) {
    const headerLine = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(Boolean) || '';

    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;

    if (semicolonCount > commaCount) {
        return ';';
    }

    if (commaCount > semicolonCount) {
        return ',';
    }

    return ';';
}

function parseCsvLine(line, delimiter = ',') {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function parseQuestionsCsv(csvText) {
    const delimiter = detectCsvDelimiter(csvText);
    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        throw new Error('CSV inválido: inclua cabeçalho e pelo menos uma pergunta.');
    }

    const headers = parseCsvLine(lines[0], delimiter).map(header => header.toLowerCase());
    const expectedHeaders = [
        'level',
        'question',
        'option1',
        'option2',
        'option3',
        'option4',
        'correctoption',
        'feedback1',
        'feedback2',
        'feedback3',
        'feedback4'
    ];

    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
        throw new Error(`CSV inválido: faltam colunas (${missingHeaders.join(', ')}).`);
    }

    const indexByHeader = Object.fromEntries(headers.map((header, idx) => [header, idx]));
    const questions = lines.slice(1).map((line, rowIndex) => {
        const columns = parseCsvLine(line, delimiter);
        const getValue = (header) => columns[indexByHeader[header]] || '';
        const correctOption = Number(getValue('correctoption'));

        if (Number.isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
            throw new Error(`Linha ${rowIndex + 2}: correctOption deve ser um número entre 1 e 4.`);
        }

        const options = [1, 2, 3, 4].map(optionNumber => {
            const text = getValue(`option${optionNumber}`).trim();
            const feedback = getValue(`feedback${optionNumber}`).trim();

            if (!text) {
                throw new Error(`Linha ${rowIndex + 2}: option${optionNumber} está vazia.`);
            }

            return {
                text,
                correct: optionNumber === correctOption,
                feedback: feedback || 'Confira este tema para reforçar seu aprendizado.'
            };
        });

        const question = getValue('question').trim();
        if (!question) {
            throw new Error(`Linha ${rowIndex + 2}: question está vazia.`);
        }

        return {
            id: rowIndex + 1,
            level: normalizeLevel(getValue('level')),
            question,
            options
        };
    });

    return questions;
}

async function loadActiveQuestionBank() {
    const fallbackQuestionBank = quizData.map(normalizeQuestion);

    try {
        const response = await fetch('perguntas.csv', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const csvText = await response.text();
        const parsedQuestions = parseQuestionsCsv(csvText).map(normalizeQuestion);
        validateQuestionBank(parsedQuestions);
        activeQuizData = parsedQuestions;
        activeQuestionBankSource = 'csv';
        activeQuestionBankErrorMessage = '';
        console.log('Banco carregado de perguntas.csv com', parsedQuestions.length, 'perguntas');
    } catch (error) {
        validateQuestionBank(fallbackQuestionBank);
        activeQuizData = fallbackQuestionBank;
        activeQuestionBankSource = 'fallback';
        activeQuestionBankErrorMessage = error.message;
        console.warn('Usando quiz-data.js como fallback:', error.message);
    }
}

function updateDataSourceBanner() {
    const banner = document.getElementById('data-source-banner');
    if (!banner) {
        return;
    }

    if (dataSourceBannerHideTimer) {
        clearTimeout(dataSourceBannerHideTimer);
        dataSourceBannerHideTimer = null;
    }

    banner.classList.remove('using-csv', 'using-fallback', 'visible');

    if (activeQuestionBankSource === 'csv') {
        banner.textContent = 'Banco carregado do CSV: perguntas.csv';
        banner.classList.add('using-csv', 'visible');
    } else {
        const fallbackReason = activeQuestionBankErrorMessage
            ? `Motivo: ${activeQuestionBankErrorMessage}`
            : 'O CSV não pôde ser carregado.';
        banner.textContent = `Usando fallback: quiz-data.js. ${fallbackReason}`;
        banner.classList.add('using-fallback', 'visible');
    }

    dataSourceBannerHideTimer = setTimeout(() => {
        banner.classList.remove('visible');
    }, 4000);
}

function buildSessionQuestionBank(questions = activeQuizData) {
    // Embaralha perguntas e opções para variar ordem e níveis a cada execução.
    return shuffleArray(questions).map(question => {
        const shuffledOptions = shuffleArray(question.options);
        return {
            ...question,
            options: shuffledOptions
        };
    });
}

function updateQuestionCounters() {
    const totalQuestions = quizSessionData.length || activeQuizData.length;
    document.getElementById('total-questions').textContent = totalQuestions;
    document.getElementById('max-score').textContent = totalQuestions * 10;
}

// Difficulty Selection Functions
function showDifficultySelection() {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('difficulty-screen').style.display = 'flex';
}

function hideDifficultySelection() {
    document.getElementById('difficulty-screen').style.display = 'none';
    document.getElementById('welcome-screen').classList.add('active');
}

function filterQuestionsByDifficulty(questions, difficulty) {
    let filtered;
    
    if (difficulty === 'Misto') {
        filtered = questions;
        // Limita a 20 perguntas para o modo Misto
        return filtered.slice(0, 20);
    }
    
    filtered = questions.filter(q => q.level === difficulty);
    // Limita a 10 perguntas para cada nível de dificuldade
    return filtered.slice(0, 10);
}

function startQuizWithDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    startQuiz();
}

// Initialize quiz
async function startQuiz() {
    if (!activeQuizData.length) {
        await loadActiveQuestionBank();
    }

    // Filter questions by selected difficulty
    let filteredQuestions = filterQuestionsByDifficulty(activeQuizData, selectedDifficulty);
    
    // If filtered list has fewer than 10 questions and is not Misto, fallback to Misto (20 questions)
    if (filteredQuestions.length < 10 && selectedDifficulty !== 'Misto') {
        console.warn(`Apenas ${filteredQuestions.length} perguntas encontradas para "${selectedDifficulty}". Usando modo Misto com 20 perguntas.`);
        filteredQuestions = filterQuestionsByDifficulty(activeQuizData, 'Misto');
        selectedDifficulty = 'Misto';
    }

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    answeredQuestions = new Set();
    eliminatedOptionsByQuestion = [];
    hintsUsage = {
        fifty: false,
        skip: false,
        university: false
    };
    universitySuggestionByQuestion = {};
    quizInProgress = true;
    quizSessionData = buildSessionQuestionBank(filteredQuestions);

    // Hide welcome/difficulty screens and show quiz screen
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('difficulty-screen').style.display = 'none';
    document.getElementById('quiz-screen').classList.add('active');

    updateDataSourceBanner();

    // Update total questions count
    updateQuestionCounters();
    document.getElementById('current-score').textContent = '0';

    // Load first question
    loadQuestion();
}

// Load current question
function loadQuestion() {
    const question = quizSessionData[currentQuestionIndex];
    const totalQuestions = quizSessionData.length;
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('question-level').textContent = `Nível: ${question.level || 'Intermediário'}`;

    // Update question text
    document.getElementById('question-text').textContent = question.question;

    // Render options
    renderOptions(question);

    // Update buttons visibility
    updateQuizButtons();
}

// Render options
function renderOptions(question) {
    const optionsContainer = document.getElementById('options-container');
    const feedbackPanel = document.getElementById('question-feedback');
    optionsContainer.innerHTML = '';
    const isAnswered = answeredQuestions.has(currentQuestionIndex);
    const eliminatedSet = eliminatedOptionsByQuestion[currentQuestionIndex] || new Set();

    // Only clear feedback if question is not answered yet
    if (!isAnswered && feedbackPanel) {
        feedbackPanel.classList.remove('visible', 'correct', 'incorrect', 'suggestion');
        feedbackPanel.textContent = '';
    }

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        // Add classes based on answer state
        if (answeredQuestions.has(currentQuestionIndex)) {
            if (option.correct) {
                optionDiv.classList.add('correct');
            } else if (userAnswers[currentQuestionIndex] === index && !option.correct) {
                optionDiv.classList.add('incorrect');
            } else {
                optionDiv.classList.add('disabled');
            }
        }

        // Check if this option is selected
        if (userAnswers[currentQuestionIndex] === index) {
            optionDiv.classList.add('selected');
        }

        if (eliminatedSet.has(index) && !isAnswered) {
            optionDiv.classList.add('eliminated', 'disabled');
        }

        const inputId = `option-${currentQuestionIndex}-${index}`;
        
        const shouldDisableOption = isAnswered || eliminatedSet.has(index);

        optionDiv.innerHTML = `
            <input 
                type="radio" 
                id="${inputId}" 
                name="answer-${currentQuestionIndex}"
                value="${index}"
                ${shouldDisableOption ? 'disabled' : ''}
                ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}
                onchange="selectOption(${index})"
            />
            <label for="${inputId}">
                <span class="radio-custom"></span>
                <span class="option-text">${option.text}</span>
            </label>
        `;

        optionsContainer.appendChild(optionDiv);
    });

    if (isAnswered && feedbackPanel) {
        const selectedIndex = userAnswers[currentQuestionIndex];
        const selectedOption = question.options[selectedIndex];
        const selectedIsCorrect = Boolean(selectedOption && selectedOption.correct);
        const correctOption = question.options.find(option => option.correct);

        feedbackPanel.classList.remove('suggestion');
        feedbackPanel.classList.add('visible', selectedIsCorrect ? 'correct' : 'incorrect');
        feedbackPanel.textContent = selectedIsCorrect
            ? (selectedOption.feedback || 'Resposta correta! Continue assim.')
            : (selectedOption.feedback || correctOption?.feedback || 'Resposta incorreta. Revise o conteúdo e tente novamente.');
    } else if (!isAnswered && feedbackPanel && universitySuggestionByQuestion[currentQuestionIndex]) {
        feedbackPanel.classList.remove('correct', 'incorrect');
        feedbackPanel.classList.add('visible', 'suggestion');
        feedbackPanel.textContent = universitySuggestionByQuestion[currentQuestionIndex];
    }

}

// Select option
function selectOption(optionIndex) {
    if (answeredQuestions.has(currentQuestionIndex)) {
        return; // Already answered
    }

    const question = quizSessionData[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = optionIndex;
    answeredQuestions.add(currentQuestionIndex);

    // Update score
    if (question.options[optionIndex].correct) {
        score += 10; // Each question is worth 10 points.
    }

    document.getElementById('current-score').textContent = score;

    // Re-render options to show feedback
    renderOptions(question);

    // Update buttons
    updateQuizButtons();
}

// Update quiz buttons
function updateQuizButtons() {
    const btnPrevious = document.getElementById('btn-previous');
    const btnNext = document.getElementById('btn-next');
    const btnCards = document.getElementById('btn-cards');
    const btnSkip = document.getElementById('btn-skip');
    const btnUniversity = document.getElementById('btn-university');
    const currentAnswered = answeredQuestions.has(currentQuestionIndex);

    // Enable/disable previous button based on position
    if (btnPrevious) {
        btnPrevious.disabled = currentQuestionIndex === 0;
    }

    // Show/hide next button or finish button
    if (currentQuestionIndex < quizSessionData.length - 1) {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Próxima';
        btnNext.disabled = !currentAnswered;
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Terminar Quiz';
        btnNext.disabled = !currentAnswered;
    }

    // Each hint can be used only once per question (independently)
    if (btnCards) {
        btnCards.disabled = currentAnswered || hintsUsage.fifty;
        btnCards.textContent = hintsUsage.fifty ? 'Cartas usadas' : 'Cartas';
    }

    if (btnSkip) {
        btnSkip.disabled = currentAnswered || hintsUsage.skip;
        btnSkip.textContent = hintsUsage.skip ? 'Pular usado' : 'Pular';
    }

    if (btnUniversity) {
        btnUniversity.disabled = currentAnswered || hintsUsage.university;
        btnUniversity.textContent = hintsUsage.university ? 'Universitários usado' : 'Universitários';
    }
}

function openHintModal() {
    if (answeredQuestions.has(currentQuestionIndex)) {
        return;
    }

    const modal = document.getElementById('hint-modal');
    const hintFifty = document.getElementById('hint-fifty');
    const hintSkip = document.getElementById('hint-skip');
    const hintUniversity = document.getElementById('hint-university');

    if (!modal || !hintFifty || !hintSkip || !hintUniversity) {
        return;
    }

    hintFifty.disabled = hintsUsage.fifty;
    hintSkip.disabled = hintsUsage.skip;
    hintUniversity.disabled = hintsUsage.university;

    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
}

function closeHintModal() {
    const modal = document.getElementById('hint-modal');
    if (!modal) {
        return;
    }

    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
}

function useFiftyHint() {
    if (hintsUsage.fifty || answeredQuestions.has(currentQuestionIndex)) {
        return;
    }

    const question = quizSessionData[currentQuestionIndex];
    const eliminatedSet = eliminatedOptionsByQuestion[currentQuestionIndex] || new Set();

    const wrongOptions = question.options
        .map((option, index) => ({ option, index }))
        .filter(item => !item.option.correct && !eliminatedSet.has(item.index))
        .map(item => item.index);

    const removeList = shuffleArray(wrongOptions).slice(0, Math.min(2, wrongOptions.length));
    removeList.forEach(index => eliminatedSet.add(index));

    eliminatedOptionsByQuestion[currentQuestionIndex] = eliminatedSet;
    hintsUsage.fifty = true;

    closeHintModal();
    renderOptions(question);
    updateQuizButtons();
}

function useSkipHint() {
    if (hintsUsage.skip) {
        return;
    }

    hintsUsage.skip = true;
    closeHintModal();

    if (currentQuestionIndex < quizSessionData.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }

    updateQuizButtons();
}

function useUniversityHint() {
    if (hintsUsage.university || answeredQuestions.has(currentQuestionIndex)) {
        return;
    }

    const question = quizSessionData[currentQuestionIndex];
    const correctIndex = question.options.findIndex(option => option.correct);
    const wrongIndexes = question.options
        .map((option, index) => ({ option, index }))
        .filter(item => !item.option.correct)
        .map(item => item.index);

    const pickCorrect = Math.random() < 0.7;
    const suggestedIndex = pickCorrect || wrongIndexes.length === 0
        ? correctIndex
        : wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];

    const confidence = pickCorrect
        ? 70 + Math.floor(Math.random() * 21)
        : 45 + Math.floor(Math.random() * 16);

    universitySuggestionByQuestion[currentQuestionIndex] = `Universitários sugerem a alternativa: \"${question.options[suggestedIndex].text}\" (confiança aproximada: ${confidence}%).`;
    hintsUsage.university = true;

    closeHintModal();
    renderOptions(question);
    updateQuizButtons();
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Next question
function nextQuestion() {
    if (!answeredQuestions.has(currentQuestionIndex)) {
        return; // Must answer current question first
    }

    if (currentQuestionIndex < quizSessionData.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        // Quiz finished
        showResults();
    }
}

// Show results
function showResults() {
    quizInProgress = false;

    // Hide quiz screen and show results screen
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('results-screen').classList.add('active');

    // Calculate final score percentage
    const maxScore = quizSessionData.length * 10;
    const percentage = Math.round((score / maxScore) * 100);
    const correctCount = score / 10;

    // Update results
    document.getElementById('final-score').textContent = percentage;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('results-total-questions').textContent = quizSessionData.length;
    document.getElementById('percentage').textContent = percentage;

    // Show appropriate message based on performance
    const resultsMessage = document.getElementById('results-message');
    let message = '';
    let className = '';

    if (percentage >= 90) {
        message = '🏆 Excelente! Você é um especialista em segurança digital!';
        className = 'excellent';
    } else if (percentage >= 70) {
        message = '👏 Muito Bom! Você tem um bom conhecimento sobre segurança na internet.';
        className = 'good';
    } else if (percentage >= 50) {
        message = '📚 Acertou mais da metade! Continue aprendendo sobre segurança digital.';
        className = 'fair';
    } else {
        message = '💡 Não desista! Releia as respostas e tente novamente para melhorar.';
        className = 'poor';
    }

    resultsMessage.textContent = message;
    resultsMessage.className = 'results-message ' + className;

    // Generate tips based on incorrect answers
    generateTips();
}

// Generate tips based on performance
function generateTips() {
    const tips = [
        '🔒 Use senhas únicas e fortes para cada conta - combine letras, números e símbolos',
        '🔍 Sempre verifique a URL antes de clicar em links de emails',
        '📲 Ative a autenticação de dois fatores (2FA) em contas importantes',
        '⚠️ Desconfie de emails pedindo informações pessoais ou bancárias',
        '🛡️ Mantenha seu antivírus e software sempre atualizados',
        '👁️ Configure a privacidade em suas redes sociais',
        '🌐 Use VPN em redes WiFi públicas',
        '📝 Não comparilhe seus dados pessoais nas redes sociais',
        '🚫 Cuidado com anexos suspeitos em emails',
        '✓ Quando tiver dúvida, procure informações em fontes confiáveis'
    ];

    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';

    // Show fewer tips to keep results visible in a single screen.
    const selectedTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);
    selectedTips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });
}

// Restart quiz
function restartQuiz() {
    // Reset variables
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    answeredQuestions = new Set();
    eliminatedOptionsByQuestion = [];
    hintsUsage = {
        fifty: false,
        skip: false,
        university: false
    };
    universitySuggestionByQuestion = {};

    // Hide results screen and show welcome screen
    document.getElementById('results-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.add('active');
}

// Generate PDF Report
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 12;
    const lineHeight = 5.5;
    const contentWidth = pageWidth - 2 * margin;

    // Cores
    const corVerde = [46, 204, 113];
    const corVermelho = [231, 76, 60];
    const corAzul = [44, 62, 127];
    const corTexto = [44, 62, 127];
    const corGray = [100, 100, 100];

    // TÍTULO
    doc.setFontSize(20);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(corAzul[0], corAzul[1], corAzul[2]);
    doc.text('Relatório de Desempenho', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('TecnoMack - Quiz de Segurança Digital', margin, yPosition);
    yPosition += 12;

    // RESUMO
    const maxScore = quizSessionData.length * 10;
    const percentage = Math.round((score / maxScore) * 100);
    const correctCount = score / 10;

    doc.setFillColor(44, 62, 127);
    doc.setDrawColor(44, 62, 127);
    doc.rect(margin, yPosition - 2, contentWidth, 18, 'F');

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Percentual Final: ${percentage}%`, margin + 3, yPosition + 2);
    doc.text(`Acertos: ${correctCount}/${quizSessionData.length}  |  Pontos: ${score}/${maxScore}`, margin + 3, yPosition + 8);

    yPosition += 22;

    // DETALHES DAS QUESTÕES - TÍTULO
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(corAzul[0], corAzul[1], corAzul[2]);
    doc.text('Detalhes das Respostas', margin, yPosition);
    yPosition += 8;

    // Iterar por cada questão
    quizSessionData.forEach((question, index) => {
        const userAnswerIndex = userAnswers[index];
        const selectedOption = question.options[userAnswerIndex];
        const isCorrect = selectedOption && selectedOption.correct;
        const correctOption = question.options.find(opt => opt.correct);

        // Verificar se precisa de nova página
        if (yPosition + 20 > pageHeight - 12) {
            doc.addPage();
            yPosition = 12;
        }

        // Cabeçalho da questão com status
        const statusText = isCorrect ? '✓ ACERTOU' : '✗ ERROU';
        const statusColor = isCorrect ? corVerde : corVermelho;

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(corAzul[0], corAzul[1], corAzul[2]);
        doc.text(`Q${index + 1}. `, margin, yPosition);
        
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(statusText, pageWidth - margin - 20, yPosition);
        
        yPosition += 5;

        // Enunciado da questão
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        
        const questionLines = doc.splitTextToSize(question.question, contentWidth - 2);
        doc.text(questionLines, margin + 1, yPosition);
        yPosition += questionLines.length * lineHeight + 2;

        // Sua resposta
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(corGray[0], corGray[1], corGray[2]);
        doc.text('Sua resposta:', margin + 1, yPosition);
        
        doc.setFont('Helvetica', 'normal');
        const userAnswerText = selectedOption ? selectedOption.text : 'Não respondida';
        const answerLines = doc.splitTextToSize(userAnswerText, contentWidth - 8);
        doc.text(answerLines, margin + 12, yPosition);
        yPosition += answerLines.length * lineHeight + 2;

        // Resposta correta (se errou)
        if (!isCorrect && correctOption) {
            doc.setFontSize(8);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(corVerde[0], corVerde[1], corVerde[2]);
            doc.text('Resposta correta:', margin + 1, yPosition);
            
            doc.setFont('Helvetica', 'normal');
            const correctLines = doc.splitTextToSize(correctOption.text, contentWidth - 8);
            doc.text(correctLines, margin + 12, yPosition);
            yPosition += correctLines.length * lineHeight + 2;
        }

        // Separador simples
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;
    });

    // RODAPÉ
    yPosition = pageHeight - 10;
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.text(`Relatório gerado em: ${dataAtual}`, margin, yPosition);

    // Download
    doc.save('Relatorio_TecnoMack.pdf');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadActiveQuestionBank();
    updateQuestionCounters();
    updateDataSourceBanner();
    console.log('Quiz initialized with', activeQuizData.length, 'questions');
});

document.addEventListener('click', (event) => {
    const modal = document.getElementById('hint-modal');
    if (!modal || !modal.classList.contains('visible')) {
        return;
    }

    if (event.target === modal) {
        closeHintModal();
    }
});
