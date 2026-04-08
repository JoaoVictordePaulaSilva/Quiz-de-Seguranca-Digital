// Quiz Logic
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let answeredQuestions = new Set();
let quizInProgress = false;

// Initialize quiz
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    answeredQuestions = new Set();
    quizInProgress = true;

    // Hide welcome screen and show quiz screen
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');

    // Update total questions count
    document.getElementById('total-questions').textContent = quizData.length;

    // Load first question
    loadQuestion();
}

// Load current question
function loadQuestion() {
    const question = quizData[currentQuestionIndex];
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;

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

    const question = quizData[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = optionIndex;
    answeredQuestions.add(currentQuestionIndex);

    // Update score
    if (question.options[optionIndex].correct) {
        score += 10; // Each question worth 10 points (10 questions total)
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
    if (currentQuestionIndex < quizData.length - 1) {
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

    if (currentQuestionIndex < quizData.length - 1) {
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
    const percentage = Math.round((score / 100) * 100);
    const correctCount = score / 10;

    // Update results
    document.getElementById('final-score').textContent = percentage;
    document.getElementById('correct-count').textContent = correctCount;
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz initialized with', quizData.length, 'questions');
});
