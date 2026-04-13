// Quiz Logic
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let answeredQuestions = new Set();
let quizInProgress = false;
let activeQuizData = [];
let quizSessionData = [];
let activeQuestionBankSource = 'csv';
let activeQuestionBankErrorMessage = '';
let dataSourceBannerHideTimer = null;

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

function buildSessionQuestionBank() {
    // Embaralha perguntas e opções para variar ordem e níveis a cada execução.
    return shuffleArray(activeQuizData).map(question => {
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

// Initialize quiz
async function startQuiz() {
    if (!activeQuizData.length) {
        await loadActiveQuestionBank();
    }

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    answeredQuestions = new Set();
    quizInProgress = true;
    quizSessionData = buildSessionQuestionBank();

    // Hide welcome screen and show quiz screen
    document.getElementById('welcome-screen').classList.remove('active');
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
    optionsContainer.innerHTML = '';

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

        const inputId = `option-${currentQuestionIndex}-${index}`;
        const isAnswered = answeredQuestions.has(currentQuestionIndex);
        
        optionDiv.innerHTML = `
            <input 
                type="radio" 
                id="${inputId}" 
                name="answer-${currentQuestionIndex}"
                value="${index}"
                ${isAnswered ? 'disabled' : ''}
                ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}
                onchange="selectOption(${index})"
            />
            <label for="${inputId}">
                <span class="radio-custom"></span>
                <span class="option-text">${option.text}</span>
            </label>
            ${isAnswered ? `<div class="option-feedback">${option.feedback}</div>` : ''}
        `;

        optionsContainer.appendChild(optionDiv);
    });
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

    // Show/hide previous button
    if (currentQuestionIndex > 0) {
        btnPrevious.style.display = 'block';
    } else {
        btnPrevious.style.display = 'none';
    }

    // Show/hide next button or finish button
    if (currentQuestionIndex < quizSessionData.length - 1) {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Próxima →';
        btnNext.disabled = !answeredQuestions.has(currentQuestionIndex);
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Terminar Quiz';
        btnNext.disabled = !answeredQuestions.has(currentQuestionIndex);
    }
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

    // Show 5 random tips
    const selectedTips = tips.sort(() => 0.5 - Math.random()).slice(0, 5);
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

    // Hide results screen and show welcome screen
    document.getElementById('results-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadActiveQuestionBank();
    updateQuestionCounters();
    updateDataSourceBanner();
    console.log('Quiz initialized with', activeQuizData.length, 'questions');
});
