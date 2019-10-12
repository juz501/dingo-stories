import Axios from 'axios';
/* global window */
/* global document */

const setContent = (response) => {
    const state = response.data.state || '';
    const error = response.data.error || '';
    const moves = response.data.moves || [];
    const allMoves = response.data.allMoves || [];
    document.getElementById('stateImage').src = 'img/' + state + '.png';
    document.getElementById('error').innerText = error;
    allMoves.forEach( (move) => {
      const elem = document.getElementById(move);
      if ( elem ) {
        if ( moves.includes(move) ) {
          if ( ! elem.classList.contains('shown') ) {
            elem.classList.add('shown')
          }
        } else if (elem.classList.contains('shown')) {
          elem.classList.remove('shown');
        }
      }
    });
}

window.action = async (currentAction) => {
  const loadingIcon = document.getElementById('loading');
  if (loadingIcon.classList.contains('hide')) {
    loadingIcon.classList.remove('hide');
  }
  const response = await Axios.get('/api/?action=' + currentAction);
  setContent(response);
  if ( ! loadingIcon.classList.contains('hide')) {
    loadingIcon.classList.add('hide');
  }
}

window.getstatus = async () => {
  const loadingIcon = document.getElementById('loading');
  if (loadingIcon.classList.contains('hide')) {
    loadingIcon.classList.remove('hide');
  }
  const response = await Axios.get('/api');
  setContent(response);
  if ( ! loadingIcon.classList.contains('hide')) {
    loadingIcon.classList.add('hide');
  }
}

window.getstatus();
