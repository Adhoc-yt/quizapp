/* Ameliorations possibles:
- Panneau d'admin pour ajouter des questions 
  + validation (au moins 1 bonne reponse et 3 mnauvaises par question)
  + possibilite de repondre cash
*/
const startButton = document.getElementById('start-btn')
const nextButton = document.getElementById('next-btn')
const questionContainerElement = document.getElementById('question-container')
const questionElement = document.getElementById('question')
const answersElement = document.getElementById('answers')
const timerElement = document.getElementById('timer')

var snd_click = new Audio("snd/click.mp3");
var snd_countdown = new Audio("snd/countdown.mp3");
var snd_correct = new Audio("snd/correct.mp3");
var snd_wrong = new Audio("snd/incorrect.mp3");

var timerIsRunning = false;
var timerTime = 10;
var correctAnswer = "";
var fullCorrectAnswer = "";

let shuffledQuestions, currentQuestionIndex

startButton.addEventListener('click', startGame)
nextButton.addEventListener('click', () => {
  currentQuestionIndex++
  setNextQuestion()
})

function startGame() {
  startButton.classList.add('hide')
  shuffledQuestions = questions.sort(() => Math.random() - .5)
  currentQuestionIndex = 0
  questionContainerElement.classList.remove('hide')
  setNextQuestion()
}

function setNextQuestion() {
  resetState()
  showQuestion(shuffledQuestions[currentQuestionIndex])
}

function resetState() {
  clearBackgroundStatusClass(document.body)
  nextButton.classList.add('hide')
  while (answersElement.firstChild) {
    answersElement.removeChild(answersElement.firstChild)
  }
}

function selectAnswer(e) {
  const selectedButton = e.target
  const isCorrect = selectedButton.dataset.correct
  setBackgroundStatusClass(document.body, isCorrect)
  playSound(isCorrect);
  Array.from(answersElement.children).forEach(button => {
    setBackgroundStatusClass(button, button.dataset.correct)
  })
  if (shuffledQuestions.length > currentQuestionIndex + 1) {
    nextButton.classList.remove('hide')
  } else {
    startButton.innerText = 'Fin des questions'
    startButton.classList.remove('hide')
  }
}

function playSound(correct) {
  if (correct) {
    snd_correct.play();
  } else {
    snd_wrong.play();
  }
}

function setBackgroundStatusClass(element, correct) {
  clearBackgroundStatusClass(element)
  if (correct) {
    element.classList.add('correct')
  } else {
    element.classList.add('wrong')
  }
  snd_countdown.pause();
  if (timerIsRunning) {
    $('#timer').hide(250);
    timerIsRunning = false;
  }
}

function clearBackgroundStatusClass(element) {
  element.classList.remove('correct')
  element.classList.remove('wrong')
}

// chargement questions
questions = [];
fetch("questions.json").then((resp) => resp.json())
.then(function(data) {
  questions = data["questions"];
});

/* post-condition: returns an randomized array of 4 answers with 1 unique correct answer */
function showQuestion(question) {
  fullCorrectAnswer = "";
  questionElement.innerText = question.question
  $('#answers').css('display', 'none');
  $('#display-buttons').show(250);
  var answersArray = [];
  //Push a random correct answer
  correctAnswer = question.correctAnswers[Math.floor(Math.random()*question.correctAnswers.length)];
  answersArray.push(correctAnswer)
  //If we have several correct answers, we need them all for Cash
  if (question.correctAnswers.length > 1){
    fullCorrectAnswer = question.correctAnswers[0].text;
    for (i = 1; i < question.correctAnswers.length; ++i){
      fullCorrectAnswer += " // " + question.correctAnswers[i].text;
    }
  }
  //Shuffle wrong answers, then pick 3 at a random index
  shuffledWrongAnswers = question.wrongAnswers.sort(() => Math.random() - .5)
  randomIndex = Math.floor(Math.random()*question.wrongAnswers.length)
  for(i=0;i<3;++i){answersArray.push(shuffledWrongAnswers[i%shuffledWrongAnswers.length])}
  //Shuffle answers
  answersArray = answersArray.sort(() => Math.random() - 0.5);
  //Build buttons
  answersArray.forEach(answer => {
    const button = document.createElement('button')
    button.innerText = answer.text
    button.classList.add('btn')
    button.classList.add('reponse')
    //button.classList.add('hidden')
    if (answer.text == correctAnswer.text) {
      button.dataset.correct = "correct"
    } else {
      button.classList.add('volatile')
    }
    button.addEventListener('click', selectAnswer)
    answersElement.appendChild(button)
  })
}

function displayAnswers(duoCarreCash) {
  $('#display-buttons').hide();
  switch(duoCarreCash) {
    case "duo":
      //  Supprimer 2 reponses sauf si dataset correct
      $('.volatile').sort(() => Math.random() - Math.random()).slice(0, 2).remove()
      break;
    case "carre":
      //ne rien faire, afficher normal
      break;
    case "cash":
      $('#answers').empty();
      const voirReponse = document.createElement('button')
      voirReponse.innerText = "Voir la réponse"
      voirReponse.classList.add('btn')
      voirReponse.classList.add('reponse')
      voirReponse.addEventListener('click', validation)
      answersElement.appendChild(voirReponse)
      break;
    default:
      alert("erreur condition Duo/Carre/Cash");
      break;
  }
  snd_countdown.currentTime = 0;
  $('#timer').show();
  timerIsRunning = true;
  timerElement.innerText = timerTime;
  startTimer(timerTime);
  snd_countdown.play();
  $('#answers').show(100);
  $('#answers').css('display','grid');
  $('#answers').children().each(function() {
    var delay = $(this).index();
    $(this).css('fadein', delay + 's');
  });
}

function afficherReponse() {
  const reponse = document.createElement('div')
  reponse.classList.add('reponse')
  reponse.classList.add('cash')
  if (fullCorrectAnswer === ""){
    reponse.innerText = correctAnswer.text;
  } else {
    reponse.innerText = fullCorrectAnswer;
  }
  questionElement.appendChild(reponse)
}

function validation() {
  $('#answers').empty();

  snd_countdown.pause();
  $('#timer').hide(250);
  timerIsRunning = false
  
  afficherReponse();

  const valider = document.createElement('button')
  const refuser = document.createElement('button')
  valider.innerText = "Valider"
  refuser.innerText = "Refuser"
  valider.classList.add('btn')
  valider.classList.add('reponse')
  refuser.classList.add('btn')
  refuser.classList.add('reponse')
  valider.dataset.correct = "correct"
  valider.addEventListener('click', selectAnswer)
  refuser.addEventListener('click', selectAnswer)
  answersElement.appendChild(valider)
  answersElement.appendChild(refuser)
}

function startTimer(duration) {
  duration -= 1;
  var timer = setInterval(function(){

  if(duration <= 0){
    clearInterval(timer);
    timerElement.innerText = "💀";
    if (timerIsRunning) { timeUp(); }
  } else {
    timerElement.innerText = duration;
  }
  duration -= 1;
  if (!timerIsRunning){ clearInterval(timer); }
  }, 1000);
}

function timeUp() {
  timerIsRunning = false;
  $('#timer').css("animation", "shake 2s infinite ease-in-out;");
  setBackgroundStatusClass(document.body, false)
  snd_wrong.play();
  Array.from(answersElement.children).forEach(button => {
    setBackgroundStatusClass(button, button.dataset.correct)
  })
  if (shuffledQuestions.length > currentQuestionIndex + 1) {
    nextButton.classList.remove('hide')
  } else {
    startButton.innerText = 'Fin des questions'
    startButton.classList.remove('hide')
  }
}

$( document ).ready(function() {
  n = 17;
  for (i=0; i<n; ++i){ $('.scrolling').append("CACABOX - "); }
});