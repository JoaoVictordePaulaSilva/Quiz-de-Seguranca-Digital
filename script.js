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
// Track hints used per question so each hint can be used once per question
let hintsUsedByQuestion = [];

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
    currentSessionSaved = false; // Reset session save flag for new quiz
    
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
    hintsUsedByQuestion = [];
    quizInProgress = true;
    quizSessionData = buildSessionQuestionBank(filteredQuestions);
    // Keep per-question records for report details
    hintsUsedByQuestion = quizSessionData.map(() => ({ fifty: false, skip: false, university: false }));

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

    // Each hint can be used only once in the entire quiz
    const perQuestion = hintsUsedByQuestion[currentQuestionIndex] || { fifty: false, skip: false, university: false };

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
        btnUniversity.textContent = hintsUsage.university ? 'Universitarios usado' : 'Universitarios';
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

    hintFifty.disabled = answeredQuestions.has(currentQuestionIndex) || hintsUsage.fifty;
    hintSkip.disabled = answeredQuestions.has(currentQuestionIndex) || hintsUsage.skip;
    hintUniversity.disabled = answeredQuestions.has(currentQuestionIndex) || hintsUsage.university;

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
    if (answeredQuestions.has(currentQuestionIndex) || hintsUsage.fifty) {
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
    hintsUsedByQuestion[currentQuestionIndex] = hintsUsedByQuestion[currentQuestionIndex] || { fifty: false, skip: false, university: false };
    hintsUsedByQuestion[currentQuestionIndex].fifty = true;
    hintsUsage.fifty = true;

    closeHintModal();
    renderOptions(question);
    updateQuizButtons();
}

function useSkipHint() {
    if (answeredQuestions.has(currentQuestionIndex) || hintsUsage.skip) {
        return;
    }

    const question = quizSessionData[currentQuestionIndex];
    const correctIndex = question.options.findIndex(option => option.correct);

    // Skip counts as a correct answer
    userAnswers[currentQuestionIndex] = correctIndex;
    answeredQuestions.add(currentQuestionIndex);
    score += 10;
    document.getElementById('current-score').textContent = score;

    const per = hintsUsedByQuestion[currentQuestionIndex] || { fifty: false, skip: false, university: false };
    hintsUsedByQuestion[currentQuestionIndex] = per;
    hintsUsedByQuestion[currentQuestionIndex].skip = true;
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
    if (answeredQuestions.has(currentQuestionIndex) || hintsUsage.university) {
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
    hintsUsedByQuestion[currentQuestionIndex] = hintsUsedByQuestion[currentQuestionIndex] || { fifty: false, skip: false, university: false };
    hintsUsedByQuestion[currentQuestionIndex].university = true;
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

// Export session data as JSON for later import
function exportSessionDataAsJSON() {
    if (!quizSessionData.length) return;
    
    const sessionData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        quiz: {
            mode: selectedDifficulty || 'Intermediário',
            totalQuestions: quizSessionData.length,
            score,
            userAnswers,
            hintsUsedByQuestion,
            questions: quizSessionData.map((q, idx) => ({
                id: q.id,
                question: q.question,
                level: q.level,
                userAnswerIndex: userAnswers[idx],
                userAnswerText: q.options[userAnswers[idx]]?.text || '',
                isCorrect: q.options[userAnswers[idx]]?.correct || false,
                correctAnswer: q.options.find(opt => opt.correct)?.text || '',
                hintsUsed: hintsUsedByQuestion[idx] || { fifty: false, skip: false, university: false }
            }))
        }
    };
    
    // Download JSON file
    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_TecnoMack_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import report from JSON file
function importReportFromJSON(file) {
    if (!file) return false;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const sessionData = JSON.parse(e.target.result);
            
            if (!sessionData.quiz || !Array.isArray(sessionData.quiz.questions)) {
                alert('Arquivo JSON inválido. Por favor, use um arquivo exportado pelo sistema.');
                return;
            }
            
            const quiz = sessionData.quiz;
            const percent = Math.round((quiz.score / (quiz.totalQuestions * 10)) * 100);
            
            const id = 'r' + (Date.now().toString(36));
            const item = {
                id,
                participant: `Importado - ${new Date().toLocaleTimeString('pt-BR')}`,
                title: `Quiz ${quiz.mode} - ${percent}%`,
                date: new Date(sessionData.exportDate).toLocaleDateString('pt-BR'),
                mode: quiz.mode,
                totalQuestions: quiz.totalQuestions,
                correctAnswers: Math.round(quiz.score / 10),
                percent,
                approved: percent >= 70,
                hints: {
                    fifty: quiz.hintsUsedByQuestion.filter(h => h?.fifty).length,
                    skip: quiz.hintsUsedByQuestion.filter(h => h?.skip).length,
                    university: quiz.hintsUsedByQuestion.filter(h => h?.university).length
                },
                questionErrors: {},
                fullSessionData: quiz.questions,
                userAnswers: quiz.userAnswers,
                hintsUsedByQuestion: quiz.hintsUsedByQuestion,
                notes: `Relatório importado de arquivo JSON.`
            };
            
            // Calculate errors
            quiz.questions.forEach((q, idx) => {
                if (!q.isCorrect) {
                    item.questionErrors[`Q${idx + 1}`] = 1;
                }
            });
            
            reports.unshift(normalizeReport(item, reports.length));
            saveReports();
            renderReportsList();
            
            alert(`Relatório importado com sucesso!\nParticipante: ${item.participant}\nPontuação: ${percent}%`);
            showReport();
        } catch (err) {
            console.error('Erro ao importar JSON:', err);
            alert('Erro ao importar arquivo. Verifique se é um JSON válido.');
        }
    };
    reader.readAsText(file);
    return true;
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

    // Contagem de dicas usadas (somente para relatório)
    const totalFifty = hintsUsedByQuestion.filter(h => h && h.fifty).length;
    const totalSkip = hintsUsedByQuestion.filter(h => h && h.skip).length;
    const totalUniversity = hintsUsedByQuestion.filter(h => h && h.university).length;

    doc.setFillColor(44, 62, 127);
    doc.setDrawColor(44, 62, 127);
    doc.rect(margin, yPosition - 2, contentWidth, 18, 'F');

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Percentual Final: ${percentage}%`, margin + 3, yPosition + 2);
    doc.text(`Acertos: ${correctCount}/${quizSessionData.length}  |  Pontos: ${score}/${maxScore}`, margin + 3, yPosition + 8);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Dicas usadas: Cartas ${totalFifty} | Pular ${totalSkip} | Universitarios ${totalUniversity}`, margin + 3, yPosition + 14);

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
        const statusText = isCorrect ? 'ACERTOU' : 'ERROU';
        const statusColor = isCorrect ? corVerde : corVermelho;

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(corAzul[0], corAzul[1], corAzul[2]);
        doc.text(`Q${index + 1}. `, margin, yPosition);
        
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(statusText, pageWidth - margin - 24, yPosition);
        
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

        yPosition += lineHeight;
        doc.setFont('Helvetica', 'normal');
        const userAnswerText = selectedOption ? selectedOption.text : 'Nao respondida';
        const answerLines = doc.splitTextToSize(userAnswerText, contentWidth - 2);
        doc.text(answerLines, margin + 1, yPosition);
        yPosition += answerLines.length * lineHeight + 2;

        // Resposta correta (se errou)
        if (!isCorrect && correctOption) {
            doc.setFontSize(8);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(corVerde[0], corVerde[1], corVerde[2]);
            doc.text('Resposta correta:', margin + 1, yPosition);

            yPosition += lineHeight;
            doc.setFont('Helvetica', 'normal');
            const correctLines = doc.splitTextToSize(correctOption.text, contentWidth - 2);
            doc.text(correctLines, margin + 1, yPosition);
            yPosition += correctLines.length * lineHeight + 2;
        }

        // Mostrar quais dicas foram usadas nesta questão
        const perQ = hintsUsedByQuestion[index] || { fifty: false, skip: false, university: false };
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        const hintsText = `Dicas: Cartas: ${perQ.fifty ? 'Sim' : 'Nao'} | Pular: ${perQ.skip ? 'Sim' : 'Nao'} | Universitarios: ${perQ.university ? 'Sim' : 'Nao'}`;
        const hintsLines = doc.splitTextToSize(hintsText, contentWidth - 8);
        doc.text(hintsLines, margin + 1, yPosition);
        yPosition += hintsLines.length * lineHeight + 2;

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

    // Download PDF
    doc.save('Relatorio_TecnoMack.pdf');

    // Auto-save quiz as report
    saveCurrentQuizAsReport();
}

// Show integrated report with analytics based on saved reports
function showReport() {
    const reportScreen = document.getElementById('report-screen');
    const reportSummary = document.getElementById('report-session-summary');
    const reportContainer = document.getElementById('report-container');
    if (!reportScreen || !reportSummary || !reportContainer) return;

    // Auto-save current quiz session if quiz was just completed
    if (quizSessionData.length > 0 && userAnswers.length === quizSessionData.length) {
        saveCurrentQuizAsReport();
    }

    const analytics = calculateReportAnalytics(reports);

    let html = '';
    html += `<div class="report-kpi-grid report-kpi-grid-6">`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.totalParticipants}</div><div class="kpi-label">Participantes no total</div></div>`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.avgScore}%</div><div class="kpi-label">Média geral de acertos</div></div>`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.approvedCount}</div><div class="kpi-label">Aprovados (>= 70%)</div></div>`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.approvalRate}%</div><div class="kpi-label">Taxa de aprovação</div></div>`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.perfectCount}</div><div class="kpi-label">Notas 100%</div></div>`;
    html += `<div class="report-card"><div class="kpi-value report-kpi-value">${analytics.lowestScore}%</div><div class="kpi-label">Menor pontuação</div></div>`;
    html += `</div>`;

    html += `<div class="report-grid-2">`;
    html += `<div class="report-card">`;
    html += `<div class="report-section-title">Pontuação por Participante</div>`;
    html += `<div class="report-bars">`;
    analytics.participantRows.forEach((row) => {
        html += `<div class="report-bar-row">`;
        html += `<span class="report-bar-label">${row.participant}</span>`;
        html += `<progress class="report-progress ${row.score >= 90 ? 'progress-good' : row.score >= 70 ? 'progress-medium' : 'progress-risk'}" value="${row.score}" max="100"></progress>`;
        html += `<span class="report-bar-value">${row.score}%</span>`;
        html += `</div>`;
    });
    html += `</div></div>`;

    html += `<div class="report-card">`;
    html += `<div class="report-section-title">Comparativo por Dificuldade</div>`;
    html += `<div class="report-mode-grid">`;
    // Render summary cards
    Object.entries(analytics.byDifficulty).forEach(([mode, data]) => {
        html += `<div class="report-mode-card">`;
        html += `<div class="report-mode-name">${mode}</div>`;
        html += `<div class="report-mode-score">${data.avg}%</div>`;
        html += `<div class="report-mode-meta">${data.count} relatório(s)</div>`;
        html += `</div>`;
    });
    html += `</div>`;

    // Add bar charts area to fill space: avg score and approval rate per mode
    html += `<div class="report-section-title" style="margin-top:0.85rem">Gráficos por Dificuldade</div>`;
    html += `<div class="mode-charts">`;
    Object.entries(analytics.byDifficulty).forEach(([mode, data]) => {
        const avg = data.avg || 0;
        const appr = data.approvalRate || 0;
        html += `<div class="mode-chart">`;
        html += `<div class="mode-chart-header"><div class="mode-chart-label">${mode}</div><div class="mode-chart-count">${data.count} relatório(s)</div></div>`;
        html += `<div class="mode-chart-row"><div class="mode-chart-title">Média de acertos</div><div class="mode-chart-bar"><div class="mode-chart-bar-fill" style="width:${avg}%"></div></div><div class="mode-chart-value">${avg}%</div></div>`;
        html += `<div class="mode-chart-row"><div class="mode-chart-title">Taxa de aprovação</div><div class="mode-chart-bar"><div class="mode-chart-bar-fill approval" style="width:${appr}%"></div></div><div class="mode-chart-value">${appr}%</div></div>`;
        html += `</div>`;
    });
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;

    html += `<div class="report-grid-2">`;
    html += `<div class="report-card">`;
    html += `<div class="report-section-title">Uso de Dicas</div>`;
    html += `<div class="report-bars">`;
    const hintsData = [
        { label: 'Cartas', value: analytics.hints.fifty },
        { label: 'Universitários', value: analytics.hints.university },
        { label: 'Pular', value: analytics.hints.skip }
    ];
    hintsData.forEach((item) => {
        html += `<div class="report-bar-row">`;
        html += `<span class="report-bar-label">${item.label}</span>`;
        html += `<progress class="report-progress progress-info" value="${item.value}" max="${Math.max(1, analytics.totalParticipants)}"></progress>`;
        html += `<span class="report-bar-value">${item.value}</span>`;
        html += `</div>`;
    });
    html += `</div></div>`;

    html += `<div class="report-card">`;
    html += `<div class="report-section-title">Questões com Mais Erros</div>`;
    if (analytics.topErrors.length) {
        html += `<div class="report-errors-list">`;
        analytics.topErrors.forEach((item) => {
            html += `<div class="report-error-item"><span>${item.question}</span><strong>${item.count}</strong></div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="report-empty">Sem erros registrados nos relatórios atuais.</div>`;
    }
    html += `</div>`;
    html += `</div>`;

    reportSummary.innerHTML = html;
    renderReportsList();

    // Animate chart fills after render
    setTimeout(() => {
        document.querySelectorAll('.mode-chart-bar-fill').forEach(el => {
            const w = el.style.width || '0%';
            el.style.width = '0%';
            // trigger reflow
            void el.offsetWidth;
            el.style.width = w;
        });
    }, 60);

    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('results-screen').classList.remove('active');
    reportScreen.classList.add('active');
    reportContainer.scrollTop = 0;
}

function hideReport() {
    const reportScreen = document.getElementById('report-screen');
    if (!reportScreen) return;
    reportScreen.classList.remove('active');
    // show welcome or results depending on last state
    if (!quizInProgress && quizSessionData && quizSessionData.length) {
        document.getElementById('results-screen').classList.add('active');
    } else {
        document.getElementById('welcome-screen').classList.add('active');
    }
}

// --- Reports management (persist in localStorage) ---
let reports = [];
const REPORTS_KEY = 'tecnomack_reports_v1';
let currentSessionSaved = false; // Track if current quiz session was already saved

function saveCurrentQuizAsReport() {
    if (!quizSessionData.length) return;
    
    // Avoid saving the same session multiple times
    if (currentSessionSaved) return;
    
    const id = 'r' + (Date.now().toString(36));
    const sessionTotal = quizSessionData.length;
    const sessionCorrect = Math.round(score / 10);
    const percent = Math.round((sessionCorrect / sessionTotal) * 100);
    const questionErrors = {};
    
    // Calculate which questions were answered incorrectly
    quizSessionData.forEach((question, index) => {
        const chosenIndex = userAnswers[index];
        const selectedOption = question.options[chosenIndex];
        if (!selectedOption || !selectedOption.correct) {
            questionErrors[`Q${index + 1}`] = 1;
        }
    });
    
    // Count hints used per question
    const hintsCount = {
        fifty: hintsUsedByQuestion.filter(h => h?.fifty).length,
        skip: hintsUsedByQuestion.filter(h => h?.skip).length,
        university: hintsUsedByQuestion.filter(h => h?.university).length
    };
    
    const now = new Date();
    const item = {
        id,
        participant: `Quiz - ${now.toLocaleTimeString('pt-BR')}`,
        title: `Quiz ${selectedDifficulty} - ${percent}%`,
        date: now.toLocaleDateString('pt-BR'),
        mode: selectedDifficulty || 'Intermediário',
        totalQuestions: sessionTotal,
        correctAnswers: sessionCorrect,
        percent,
        approved: percent >= 70,
        hints: hintsCount,
        questionErrors,
        fullSessionData: quizSessionData.map((q, idx) => ({
            id: q.id,
            question: q.question,
            level: q.level,
            userAnswerIndex: userAnswers[idx],
            userAnswerText: q.options[userAnswers[idx]]?.text || '',
            isCorrect: q.options[userAnswers[idx]]?.correct || false,
            correctAnswer: q.options.find(opt => opt.correct)?.text || '',
            hintsUsed: hintsUsedByQuestion[idx] || { fifty: false, skip: false, university: false }
        })),
        userAnswers,
        hintsUsedByQuestion,
        notes: `Relatório gerado automaticamente ao final do quiz.`
    };
    
    reports.unshift(normalizeReport(item, reports.length));
    saveReports();
    currentSessionSaved = true;
    
    // Refresh analytics display if report screen is open
    if (document.getElementById('report-screen')?.classList.contains('active')) {
        showReport();
    }
}

function makeSampleReports(count = 10) {
    const now = new Date();
    return Array.from({ length: count }).map((_, i) => {
        const correctAnswers = Math.floor(6 + Math.random() * 5);
        const totalQuestions = 10;
        
        return {
            id: 'r' + (i + 1),
            participant: `Usuário ${i + 1}`,
            title: `Quiz ${['Iniciante', 'Intermediário', 'Avançado'][i % 3]} - ${Math.round((correctAnswers / totalQuestions) * 100)}%`,
            date: new Date(now.getTime() - i * 86400000).toLocaleDateString('pt-BR'),
            mode: i % 3 === 0 ? 'Avançado' : i % 2 === 0 ? 'Intermediário' : 'Iniciante',
            totalQuestions: 10,
            correctAnswers,
            percent: Math.round((correctAnswers / 10) * 100),
            approved: correctAnswers >= 7,
            hints: {
                fifty: Math.floor(Math.random() * 3),
                skip: Math.floor(Math.random() * 2),
                university: Math.floor(Math.random() * 2)
            },
            questionErrors: {
                Q1: Math.floor(Math.random() * 2),
                Q3: Math.floor(Math.random() * 2),
                Q5: Math.floor(Math.random() * 2),
                Q7: Math.floor(Math.random() * 2)
            },
            fullSessionData: [],
            userAnswers: [],
            hintsUsedByQuestion: Array.from({length: 10}).map(() => ({
                fifty: Math.random() > 0.7,
                skip: Math.random() > 0.8,
                university: Math.random() > 0.8
            })),
            notes: `Relatório de amostra - Usuário ${i + 1}.`
        };
    });
}

function normalizeReport(report, index) {
    const totalQuestions = Number(report.totalQuestions) || 10;
    const normalizedCorrect = Number(report.correctAnswers);
    const fallbackPercent = Number(report.percent) || 0;
    const computedPercent = Number.isFinite(normalizedCorrect)
        ? Math.round((normalizedCorrect / totalQuestions) * 100)
        : fallbackPercent;

    return {
        id: report.id || `r${index + 1}`,
        participant: report.participant || `P${index + 1}`,
        title: report.title || `Relatório ${index + 1}`,
        date: report.date || new Date().toLocaleDateString('pt-BR'),
        mode: report.mode || 'Intermediário',
        totalQuestions,
        correctAnswers: Number.isFinite(normalizedCorrect)
            ? normalizedCorrect
            : Math.round((fallbackPercent / 100) * totalQuestions),
        percent: computedPercent,
        approved: computedPercent >= 70,
        hints: {
            fifty: Number(report?.hints?.fifty) || 0,
            skip: Number(report?.hints?.skip) || 0,
            university: Number(report?.hints?.university) || 0
        },
        questionErrors: report.questionErrors || {},
        fullSessionData: report.fullSessionData || [],
        userAnswers: report.userAnswers || [],
        hintsUsedByQuestion: report.hintsUsedByQuestion || [],
        notes: report.notes || ''
    };
}

function calculateReportAnalytics(items) {
    const normalized = items.map(normalizeReport);
    if (!normalized.length) {
        return {
            totalParticipants: 0,
            avgScore: 0,
            approvedCount: 0,
            approvalRate: 0,
            perfectCount: 0,
            lowestScore: 0,
            participantRows: [],
            byDifficulty: {},
            hints: { fifty: 0, skip: 0, university: 0 },
            topErrors: []
        };
    }

    const totalParticipants = normalized.length;
    const totalScore = normalized.reduce((acc, item) => acc + item.percent, 0);
    const approvedCount = normalized.filter(item => item.approved).length;
    const perfectCount = normalized.filter(item => item.percent === 100).length;
    const lowestScore = Math.min(...normalized.map(item => item.percent));

    const byDifficultyMap = {};
    const hintTotals = { fifty: 0, skip: 0, university: 0 };
    const errorTotals = {};

    normalized.forEach((item) => {
        if (!byDifficultyMap[item.mode]) {
            byDifficultyMap[item.mode] = { count: 0, total: 0, approved: 0 };
        }
        byDifficultyMap[item.mode].count += 1;
        byDifficultyMap[item.mode].total += item.percent;
        if (item.approved) byDifficultyMap[item.mode].approved += 1;

        hintTotals.fifty += item.hints.fifty;
        hintTotals.skip += item.hints.skip;
        hintTotals.university += item.hints.university;

        Object.entries(item.questionErrors).forEach(([question, count]) => {
            errorTotals[question] = (errorTotals[question] || 0) + Number(count || 0);
        });
    });

    const byDifficulty = {};
    Object.entries(byDifficultyMap).forEach(([mode, value]) => {
        byDifficulty[mode] = {
            count: value.count,
            avg: Math.round(value.total / value.count),
            approved: value.approved,
            approvalRate: Math.round((value.approved / value.count) * 100)
        };
    });

    const topErrors = Object.entries(errorTotals)
        .map(([question, count]) => ({ question, count }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const participantRows = normalized
        .map(item => ({ participant: item.participant, score: item.percent }))
        .sort((a, b) => b.score - a.score);

    return {
        totalParticipants,
        avgScore: Math.round(totalScore / totalParticipants),
        approvedCount,
        approvalRate: Math.round((approvedCount / totalParticipants) * 100),
        perfectCount,
        lowestScore,
        participantRows,
        byDifficulty,
        hints: hintTotals,
        topErrors
    };
}

function loadReports() {
    try {
        const raw = localStorage.getItem(REPORTS_KEY);
        if (raw) {
            reports = JSON.parse(raw).map(normalizeReport);
            return;
        }
        // If localStorage empty, try to load converted_reports.json from server
        // This file can be generated by tools/convert_reports.js
        // If fetch fails, fall back to sample reports
        try {
            // Note: fetch is async; use synchronous XHR fallback is avoided — we'll use fetch and wait in setupReportsUI
        } catch (e) {
            // ignore
        }
        reports = makeSampleReports(10).map(normalizeReport);
        saveReports();
    } catch (err) {
        console.warn('Erro ao carregar reports:', err);
        reports = makeSampleReports(10).map(normalizeReport);
    }
}

// Try to fetch converted reports generated server-side.
// Preferred: reports/reports_manifest.json with one JSON per PDF.
// Fallback: reports/converted_reports.json (aggregate file).
async function fetchConvertedReports() {
    try {
        const manifestResp = await fetch('reports/reports_manifest.json', { cache: 'no-store' });
        if (manifestResp.ok) {
            const manifest = await manifestResp.json();
            if (Array.isArray(manifest) && manifest.length > 0) {
                const fileLoads = manifest.map(async (entry) => {
                    if (!entry?.jsonFile) return null;
                    const res = await fetch(`reports/${entry.jsonFile}`, { cache: 'no-store' });
                    if (!res.ok) return null;
                    return await res.json();
                });
                const loaded = await Promise.all(fileLoads);
                const items = loaded
                    .filter(Boolean)
                    .map((item) => Array.isArray(item) ? item[0] : item)
                    .filter(Boolean);
                if (items.length > 0) {
                    reports = items.map(normalizeReport);
                    saveReports();
                    return true;
                }
            }
        }

        // Backward-compatible fallback
        const resp = await fetch('reports/converted_reports.json', { cache: 'no-store' });
        if (!resp.ok) return false;
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
            reports = data.map(normalizeReport);
            saveReports();
            return true;
        }
    } catch (err) {
        // console.warn('No converted reports file found', err);
    }
    return false;
}

function saveReports() {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

function renderReportsList() {
    const list = document.getElementById('reports-list');
    if (!list) return;
    list.innerHTML = '';
    reports.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'report-card';
        card.innerHTML = `
            <div class="report-item-head">
                <div class="report-item-title">${r.title}</div>
                <div class="report-item-date">${r.date}</div>
            </div>
            <div class="report-item-score">${r.participant} - ${r.mode} - <strong>${r.percent}%</strong></div>
            <div class="report-item-actions">
                <button class="btn btn-primary report-btn-grow" onclick="viewReport('${r.id}')">Ver</button>
                <button class="btn btn-secondary" onclick="removeReport('${r.id}')">Excluir</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function addReport(data) {
    const id = 'r' + (Date.now().toString(36));
    const sessionTotal = quizSessionData.length || 10;
    const sessionCorrect = quizSessionData.length ? Math.round(score / 10) : Math.floor(6 + Math.random() * 5);
    const percent = Math.round((sessionCorrect / sessionTotal) * 100);
    const questionErrors = {};
    const fullSessionData = [];

    if (quizSessionData.length) {
        quizSessionData.forEach((question, index) => {
            const chosenIndex = userAnswers[index];
            const selectedOption = question.options[chosenIndex];
            const isCorrect = selectedOption && selectedOption.correct;
            
            if (!isCorrect) {
                questionErrors[`Q${index + 1}`] = 1;
            }
            
            fullSessionData.push({
                id: question.id,
                question: question.question,
                level: question.level,
                userAnswerIndex: chosenIndex,
                userAnswerText: selectedOption?.text || '',
                isCorrect,
                correctAnswer: question.options.find(opt => opt.correct)?.text || '',
                hintsUsed: hintsUsedByQuestion[index] || { fifty: false, skip: false, university: false }
            });
        });
    }

    const item = {
        id,
        participant: data.participant || `P${reports.length + 1}`,
        title: data.title || `Relatório ${reports.length + 1}`,
        date: data.date || new Date().toLocaleDateString('pt-BR'),
        mode: data.mode || selectedDifficulty || 'Intermediário',
        totalQuestions: sessionTotal,
        correctAnswers: sessionCorrect,
        percent,
        approved: percent >= 70,
        hints: {
            fifty: hintsUsedByQuestion.filter(h => h?.fifty).length,
            skip: hintsUsedByQuestion.filter(h => h?.skip).length,
            university: hintsUsedByQuestion.filter(h => h?.university).length
        },
        questionErrors,
        fullSessionData,
        userAnswers: quizSessionData.length ? [...userAnswers] : [],
        hintsUsedByQuestion: quizSessionData.length ? [...hintsUsedByQuestion] : [],
        notes: data.notes || ''
    };
    reports.unshift(normalizeReport(item, reports.length));
    saveReports();
    renderReportsList();
}

function removeReport(id) {
    reports = reports.filter(r => r.id !== id);
    saveReports();
    renderReportsList();
    const detail = document.getElementById('report-detail');
    if (detail && detail.dataset.currentId === id) {
        detail.classList.remove('visible');
        detail.dataset.currentId = '';
    }
    if (document.getElementById('report-screen')?.classList.contains('active')) {
        showReport();
    }
}

function viewReport(id) {
    const r = reports.find(x => x.id === id);
    const detail = document.getElementById('report-detail');
    if (!r || !detail) return;
    detail.dataset.currentId = id;
    detail.classList.add('visible');
    
    let html = `
        <div class="report-item-head">
            <strong class="report-item-title">${r.title}</strong>
            <div class="report-item-date">${r.date}</div>
        </div>
        <div class="report-item-score">Participante: <strong>${r.participant}</strong></div>
        <div class="report-item-score">Dificuldade: <strong>${r.mode}</strong></div>
        <div class="report-item-score">Pontuação: <strong>${r.percent}%</strong> (${r.correctAnswers}/${r.totalQuestions})</div>
        <div class="report-item-score">Dicas usadas: Cartas ${r.hints.fifty}, Universitários ${r.hints.university}, Pular ${r.hints.skip}</div>
        <div class="report-detail-notes">${r.notes}</div>
    `;
    
    // Show detailed answers if available
    if (r.fullSessionData && r.fullSessionData.length > 0) {
        html += `<div class="report-section-title" style="margin-top: 20px;">Detalhes das Questões</div>`;
        r.fullSessionData.forEach((qData, idx) => {
            const statusClass = qData.isCorrect ? 'status-correct' : 'status-incorrect';
            const statusText = qData.isCorrect ? 'ACERTOU' : 'ERROU';
            
            html += `
                <div class="report-question-card">
                    <div class="report-question-head">
                        <span>Q${idx + 1}</span>
                        <span class="report-status ${statusClass}">${statusText}</span>
                    </div>
                    <div style="margin: 8px 0; font-weight: bold; color: var(--primary-dark);">${qData.question}</div>
                    <div style="margin: 5px 0; font-size: 0.9em;">
                        <strong>Sua resposta:</strong> ${qData.userAnswerText || 'Não respondida'}
                    </div>
                    ${!qData.isCorrect ? `<div style="margin: 5px 0; font-size: 0.9em; color: var(--success-color);"><strong>Resposta correta:</strong> ${qData.correctAnswer}</div>` : ''}
                </div>
            `;
        });
    }
    
    detail.innerHTML = html;
}

function clearAllReports() {
    if (!confirm('Remover todos os relatórios? Esta ação não pode ser desfeita.')) return;
    reports = [];
    saveReports();
    renderReportsList();
    const detail = document.getElementById('report-detail');
    if (detail) { detail.classList.remove('visible'); detail.dataset.currentId = ''; }
    if (document.getElementById('report-screen')?.classList.contains('active')) {
        showReport();
    }
}

async function setupReportsUI() {
    // Try to load from localStorage or server-provided converted JSON
    await fetchConvertedReports();
    if (!reports || !reports.length) loadReports();
    renderReportsList();
    const btnClear = document.getElementById('btn-clear-reports');
    const fileInput = document.getElementById('report-file-input');
    const btnImport = document.getElementById('btn-import-json');
    
    if (btnImport && fileInput) {
        btnImport.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importReportFromJSON(file);
            }
            e.target.value = ''; // Reset input
        });
    }
    
    if (btnClear) {
        btnClear.addEventListener('click', clearAllReports);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize reports UI
    try {
        await setupReportsUI();
    } catch (e) {
        console.warn('setupReportsUI failed:', e);
    }
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
