import Axios from 'axios';
/* global window */
/* global document */

const setContent = (response) => {
    const state = response.data.state || '';
    const error = response.data.error || '';
    document.getElementById('state').innerText = state;
    document.getElementById('error').innerText = error; 
}

window.melt = () => {
    Axios.get('/api/?action=melt').then((response) => { 
        setContent(response);
    }).catch((error) => { console.log(error); });
}

window.freeze = () => {
    Axios.get('/api/?action=freeze').then((response) => { 
        setContent(response);
    }).catch((error) => { console.log(error); });
}

window.vaporize = () => {
    Axios.get('/api/?action=vaporize').then((response) => { 
        setContent(response); 
    }).catch((error) => { console.log(error); });
}

window.condense = () => {
    Axios.get('/api/?action=condense').then((response) => { 
        setContent(response);
    }).catch((error) => { console.log(error); });
}

window.getstatus = () => {
    Axios.get('/api').then((response) => { 
        setContent(response);
    }).catch((error) => { console.log(error); });
}

window.getstatus();