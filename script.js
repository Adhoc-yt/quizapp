/* Ameliorations possibles:
- Panneau d'admin pour ajouter des questions 
  + validation (au moins 1 bonne reponse et 3 mauvaises par question)
  + possibilite de repondre cash
*/
const startButton = document.getElementById('start-btn')
const nextButton = document.getElementById('next-btn')
const questionContainerElement = document.getElementById('question-container')
const questionElement = document.getElementById('question')
const answersElement = document.getElementById('answers')
const timerElement = document.getElementById('timer')
const joueursElement = document.getElementById('joueurs')

var snd_click = new Audio("snd/click.mp3");
var snd_countdown = new Audio("snd/countdown.mp3");
var snd_correct = new Audio("snd/correct.mp3");
var snd_wrong = new Audio("snd/incorrect.mp3");

var timerIsRunning = false;
var roundIsActive = false;
var timerTime = 10;
var correctAnswer = "";
var fullCorrectAnswer = "";
var selectedJoueur = -1;

var pointsAtStake = 0;

let shuffledQuestions, currentQuestionIndex

startButton.addEventListener('click', startGame)
nextButton.addEventListener('click', () => {
  roundIsActive = true;
  currentQuestionIndex++
  setNextQuestion()
})

function startGame() {
  roundIsActive = true;
  selectedJoueur = joueurs.length - 1;
  startButton.classList.add('hide')
  shuffledQuestions = questions.sort(() => Math.random() - .5)
  currentQuestionIndex = 0
  questionContainerElement.classList.remove('hide')
  setNextQuestion()
}

function setNextQuestion() {
  resetState();
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
  if (roundIsActive){
    manageSoundAndPoints(isCorrect);
  }
  Array.from(answersElement.children).forEach(button => {
    setBackgroundStatusClass(button, button.dataset.correct)
  })
  questionSuivante()
}

function endGame() {
  $('#joueurs').fadeOut()
  $('.container').fadeOut()
  setTimeout(function(){
    $('.selected').removeClass('selected')
    trierJoueurs()
    $('#joueurs').addClass('container')
    $('#joueurs').css('position', 'relative').fadeIn(250)
  }, 500);
}

function trierJoueurs() {
  var items = $('#joueurs').children("div").sort(function(a, b) {
      var vA = $("div.score", a).text();
      var vB = $("div.score", b).text();
      return (vA > vB) ? -1 : (vA < vB) ? 1 : 0;
  });
  $('#joueurs').append(items);
}

function manageSoundAndPoints(correct) {
  if (correct) {
    snd_correct.play();
    addPoints(pointsAtStake);
  } else {
    snd_wrong.play();
  }
  roundIsActive = false;
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

/* post-condition: returns an randomized array of 4 answers with 1 unique correct answer */
function showQuestion(question) {
  selectNextJoueur();
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
      pointsAtStake = 1;
      break;
    case "carre":
      pointsAtStake = 3;
      break;
    case "cash":
      $('#answers').empty();
      const voirReponse = document.createElement('button')
      voirReponse.innerText = "Voir la réponse"
      voirReponse.classList.add('btn')
      voirReponse.classList.add('reponse')
      voirReponse.addEventListener('click', validation)
      answersElement.appendChild(voirReponse)
      pointsAtStake = 5;
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
  roundIsActive = false;
  $('#timer').css("animation", "shake 2s infinite ease-in-out;");
  setBackgroundStatusClass(document.body, false)
  snd_wrong.play();
  Array.from(answersElement.children).forEach(button => {
    setBackgroundStatusClass(button, button.dataset.correct)
  })

}

function questionSuivante() {
  if (shuffledQuestions.length > currentQuestionIndex + 1) {
    nextButton.classList.remove('hide')
  } else {
    startButton.innerText = 'Voir les resultats'
    startButton.addEventListener('click', endGame)
    startButton.classList.remove('hide')
  }
}

function showPlayers() {
  joueurs.forEach(joueurObj => {
    const joueur = document.createElement('div')
    joueur.classList.add('joueur')
    
    const score = document.createElement('div')
    score.classList.add('score')
    score.innerText = joueurObj.score;

    const avatar = document.createElement('div')
    avatar.innerHTML = "<img width=\"69px\" src=\"" + joueurObj.avatar + "\" />";
    avatar.classList.add('avatar')
    
    joueur.appendChild(score)
    joueur.appendChild(avatar)
    joueur.innerHTML += joueurObj.nom
    joueursElement.appendChild(joueur)
  })
}

function selectNextJoueur() {
  $('#joueurs').children().eq(selectedJoueur).removeClass('selected');
  selectedJoueur = (selectedJoueur + 1) % joueurs.length;
  $('#joueurs').children().eq(selectedJoueur).addClass('selected');
}

function addPoints(pts) {
  newScore = parseInt($('.score').eq(selectedJoueur).text()) + parseInt(pts);
  $('.score').eq(selectedJoueur).text(newScore)
}


$(document).ready(function() {
  n = 17;
  for (i=0; i<n; ++i){ $('.scrolling').append("CACABOX - "); }

  // chargement questions
  questions = [];
  fetch("questions.json").then((resp) => resp.json())
  .then(function(data) {
    questions = data["questions"];
  });

  // chargement joueurs
  joueurs = [];
  fetch("joueurs.json").then((resp) => resp.json())
  .then(function(data) {
    joueurs = data["joueurs"];
    showPlayers();
  });

});