/**
 * =======================================================================================
 *                           (c) GemPixel
 * ---------------------------------------------------------------------------------------
 *  This software is packaged with an exclusive framework as such distribution
 *  or modification of this framework is not allowed before prior consent from
 *  GemPixel. If you find that this not distributed
 *  by GemPixel or authorized parties, you must not use this software and contact GemPixel
 *  at https://gempixel.com/contact to inform them of this misuse.
 * =======================================================================================
 *
 * @package GemPixel\ChromeExtension
 * @author GemPixel (https://gempixel.com)
 * @license https://gempixel.com/licenses
 * @link https://gempixel.com
 */



const baseURL = 'https://shotcut.in';

const numURLs = 8;


const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

document.addEventListener('DOMContentLoaded', function () {

    const shortenForm = $('#shorten-form');
    const settingsForm = $('#settings-form');
    const loginForm = $('#login-form');
    const settingsMessage = $('#settingsMessage');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            $('#longUrl').value = tabs[0].url;
        }
    });

    chrome.runtime.sendMessage({ action: "popupReady" }, (response) => {
        if (!chrome.runtime.lastError && response && response.url) {
            $('#longUrl').value = response.url;
        }
    });

    function updateDomainSelect(apiKey) {
        fetch(`${baseURL}/api/domains`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Script': `Chrome Extension`
            }
        })
        .then(response => response.json())
        .then(data => {
            const domainSelect = $('#brandedDomain');
            domainSelect.innerHTML = `<option value="">${ee('defaultDomain')}</option>`;

            if (!data.data) return openTab(null, 'settingsContainer');

            data.data.domains.forEach(domain => {
                domainSelect.innerHTML += `<option value="${domain.domain}">${domain.domain}</option>`;
            });
        })
        .catch();
    }

    function bootExtension(result) {
        const apiKey = result.apiKey;
        if (apiKey) {
            $('#apiKey').value = apiKey;
			$('#username').innerText = result.data.username;
            $('#avatar').innerHTML = `<img src="${result.data.avatar}" class="logo">`;
            $('#plan').innerText = result.data.status;
			$('#menu').style.display = 'block';
            updateDomainSelect(apiKey);
        } else {
            $('#mainscreen').style.display = "none";
            $('#loginscreen').style.display = "block";
        }
    }

    chrome.storage.sync.get(['apiKey', 'data'], bootExtension);

    shortenForm.addEventListener('submit', function (event) {
        event.preventDefault();
        $('#errorMsg').style.display = "none";
        const url = $('#longUrl').value.trim();
        const brandedDomain = $('#brandedDomain').value.trim();
        const customAlias = $('#customAlias').value.trim();

        if (!url) {
            $('#errorMsg').style.display = "block";
            $('#errorMsg').innerText = ee('invalidURL');
            return;
        }

        chrome.storage.sync.get(['apiKey'], function (result) {
            const apiKey = result.apiKey;
            if (apiKey) {
                shortenUrl(apiKey, url, brandedDomain, customAlias);
            } else {
                $('#errorMsg').style.display = "block";
                $('#errorMsg').innerText = ee('apiNotSet');
            }
        });
    });

    settingsForm.addEventListener('submit', function (event) {
        event.preventDefault();
        $('#errorMsg').style.display = "none";
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<span class="spinner"></span>';
        submitButton.disabled = true;

        const apiKey = $('#apiKey').value.trim();

        if (!apiKey) {
            $('#settingsMessage').style.display = "block";
			$('#settingsMessage').classList.add('errorMsg');
			$('#settingsMessage').innerText = ee('invalidApi');
            return;
        }

        fetch(baseURL+'/api/account', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Script': `Chrome Extension`
            }
        })
        .then(response => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            if (response.status !== 200) {
                $('#settingsMessage').style.display = "block";
				$('#settingsMessage').classList.add('errorMsg');
				$('#settingsMessage').innerText = ee('invalidApi');
            }
            return response.json();
        })
        .then(data => {
            if(!data.error){
                chrome.storage.sync.set({ apiKey: apiKey, data: data.data }, function () {
                    $('#loginscreen').style.display = "none";
					$('#settingsMessage').style.display = "block";
					$('#settingsMessage').innerText = ee('apiSet');
                });
            } else {
                $('#settingsMessage').style.display = "block";
				$('#settingsMessage').classList.add('errorMsg');
				$('#settingsMessage').innerText = ee('invalidApi');
            }
        })
        .catch(error => {
            $('#settingsMessage').style.display = "block";
			$('#settingsMessage').classList.add('errorMsg');
			$('#settingsMessage').innerText = ee('invalidApi');
        });
    });

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        $('#loginMessage').style.display = "none";
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<span class="spinner"></span>';
        submitButton.disabled = true;

        const apiKey = $('#loginapiKey').value.trim();

        if (!apiKey) {
            settingsMessage.innerText = ee('invalidApi');
            return;
        }

        fetch(baseURL+'/api/account', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Script': `Chrome Extension`
            }
        })
        .then(response => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            if (response.status !== 200) {
                $('#loginMessage').style.display = "block";
                $('#loginMessage').innerText = ee('invalidApi');
            }
            return response.json();
        })
        .then(data => {
            if(!data.error){
                chrome.storage.sync.set({ apiKey: apiKey, data: data.data }, function () {
                    $('#settingsMessage').style.display = "block";
					$('#settingsMessage').innerText = ee('apiSet');
                    $('#mainscreen').style.display = "block";
                    $('#loginscreen').style.display = "none";
					$('#menu').style.display = 'block';
                    $('#loginMessage').innerText = ee('apiSet');
                    $('#apiKey').value = apiKey;
					$('#username').innerText = data.data.username;
					$('#avatar').innerHTML = `<img src="${data.data.avatar}" class="logo">`;
                    $('#plan').innerText = data.data.status;
					updateDomainSelect(apiKey);
                });
            } else {
                $('#loginMessage').style.display = "block";
                $('#loginMessage').innerText = data.message;
            }
        })
        .catch(error => {
            $('#loginMessage').style.display = "block";
            $('#loginMessage').innerText = ee('invalidApi');
        });
    });

    ['shorten', 'links', 'settings', 'logout'].forEach(id => {
        $(`#${id}`).addEventListener('click', e => openTab(e, `${id}Container`));
    });

	$('#links').addEventListener('click', function(){
		chrome.storage.sync.get(['apiKey'], function(result){
			const apiKey = result.apiKey;
			if (!apiKey) {
				return;
			}

			fetch(baseURL+'/api/urls?limit='+numURLs+'&order=date', {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
                    'X-Script': `Chrome Extension`
				}
			})
			.then(response => {
				if (response.status !== 200) {
					$('#linkerrorMsg').style.display = "block";
					$('#linkerrorMsg').classList.add('errorMsg');
					$('#linkerrorMsg').innerText = ee('invalidApi');
				}
				return response.json();
			})
			.then(data => {
				if(!data.error){
					let linksList = '<ul>';
					for (let i = 0; i < data.data.urls.length; i++) {
						let title = data.data.urls[i].title && data.data.urls[i].title.length > 1 ? data.data.urls[i].title : data.data.urls[i].longurl;
						let createdDate = new Date(data.data.urls[i].date);
						let formattedDate = createdDate.toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						});
						linksList += `<li><a href="${data.data.urls[i].longurl}" target="_blank" class="title"><img src="${baseURL}/${data.data.urls[i].id}/ico" class="icon" width="16"> <span class="align-middle">${title}</span></a><p><a href="#" data-href="${data.data.urls[i].shorturl}" class="shorturl">${data.data.urls[i].shorturl}</a></p><p> <a href="${data.data.urls[i].shorturl}/qr/800" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 448 512"><path d="M0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48L0 80zM64 96l0 64 64 0 0-64L64 96zM0 336c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96zm64 16l0 64 64 0 0-64-64 0zM304 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm80 64l-64 0 0 64 64 0 0-64zM256 304c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s7.2-16 16-16s16 7.2 16 16l0 96c0 8.8-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16s-7.2-16-16-16s-16 7.2-16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-160zM368 480a16 16 0 1 1 0-32 16 16 0 1 1 0 32zm64 0a16 16 0 1 1 0-32 16 16 0 1 1 0 32z"/></svg></a> <svg xmlns="http://www.w3.org/2000/svg" class="ms" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> <span class="counter">${data.data.urls[i].clicks}</span><svg xmlns="http://www.w3.org/2000/svg" class="ms" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> <span class="counter">${formattedDate}</span></p></li>`;
					}
                    linksList +=`</ul><a href="${baseURL}/user" target="_blank" class="button"><small>${ee('viewMore')}</small></a>`;

					$('#linkList').innerHTML = linksList;

					document.addEventListener('click', function(e) {
						if (e.target && e.target.matches('a[data-href]')) {
							e.preventDefault();
							const shortUrl = e.target.getAttribute('data-href');

							navigator.clipboard.writeText(shortUrl).then(() => {
								const originalText = e.target.textContent;
								e.target.textContent = ee('copied');
								e.target.style.transition = 'all 0.3s ease';
								e.target.style.color = '#27b327';

								setTimeout(() => {
									e.target.textContent = originalText;
									e.target.style.color = '';
								}, 2000);
							}).catch(err => {
								console.error('Failed to copy: ', err);
							});
						}
					});
				} else {
					$('#linkerrorMsg').style.display = "block";
					$('#linkerrorMsg').classList.add('errorMsg');
					$('#linkerrorMsg').innerText = ee('invalidApi');
				}
			})
			.catch(error => {
			});
		});
	});

    $('#backlink').addEventListener('click', function(e) {
        $('#shorten').click();
        $('#shorten-form').style.display = 'flex';
        $('#resultLink').style.display = 'none';
        ['longUrl', 'brandedDomain', 'customAlias'].forEach(id => $(`#${id}`).value = '');
    });

	$('#logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        $('#shorten').click();
		chrome.storage.sync.remove(['apiKey']);
		$('#mainscreen').style.display = "none";
		$('#loginscreen').style.display = "block";
		$('#menu').style.display = 'none';
		$('#apiKey').value = '';
	});

    $('#cancelBtn').addEventListener('click', function(e){
        e.preventDefault();
        $('#shorten').click();
    });

    const copyButton = $('#copyButton');
    const shortlinkInput = $('#shortlink');

    copyButton.addEventListener('click', function() {
        shortlinkInput.select();
        document.execCommand('copy');

        copyButton.textContent = ee('copied');
        setTimeout(() => {
            copyButton.textContent = ee('copyButton');
        }, 2000);
    });

    $('#footerLink').href = baseURL+'?utm_source=chromeextension&utm_medium=click&utm_campaign=extension';
    $('#accountLink').href = baseURL+'/user?utm_source=chromeextension&utm_medium=click&utm_campaign=extension';
});

function shortenUrl(apiKey, longUrl, domain, alias) {
    const errorMsg = $('#errorMsg');
    errorMsg.style.display = "none";

    if (!apiKey || !longUrl) {
        errorMsg.style.display = "block";
        errorMsg.innerText = ee('missingInfo');
        return;
    }

    const submitButton = $('#shorten-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="spinner"></span>';
    submitButton.disabled = true;

    fetch(`${baseURL}/api/url/add`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Script': `Chrome Extension`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: longUrl, domain, custom: alias })
    })
    .then(response => {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (!data.shorturl) {
            errorMsg.style.display = "block";
            errorMsg.innerText = data.message;
            return;
        }
        $('#shorten-form').style.display = 'none';
        $('#resultLink').style.display = 'block';
        $('#shortlink').value = data.shorturl;
    })
    .catch(error => {
        errorMsg.style.display = "block";
        errorMsg.innerText = ee('unexpectedError');
    });
}

function openTab(evt, tabName) {
    $$('.tabcontent').forEach(el => el.style.display = "none");
    $$('.tablink').forEach(el => el.classList.remove("active"));
    $(`#${tabName}`).style.display = "block";
    evt?.currentTarget.classList.add("active");
}

function localize() {
    const lang = navigator.language.split('-')[0] || 'en';
    const selectedLang = locales[lang] ? lang : 'en';

    $$('[data-locale]').forEach(element => {
        const key = element.getAttribute('data-locale');
        if (locales[selectedLang][key]) {
            element.textContent = locales[selectedLang][key];
        }
    });
}

const ee = (key) => {
    const lang = navigator.language.split('-')[0] || 'en';
    const selectedLang = locales[lang] ? lang : 'en';
    return locales[selectedLang][key] || key;
};

document.addEventListener('DOMContentLoaded', localize);