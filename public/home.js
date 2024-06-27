$(document).ready(function() {
    console.log('Document is ready');

    $('#createServer').on('click', function() {
        console.log('Create Server button clicked');
        $.post('/create-server')
            .done(function(data) {
                console.log('Server created:', data);
                $('#servers').append(`
                    <div class="server_join" data-index="${data.index}" data-players="${data.players}">
                        <div class="server">SERVER ${data.index + 1}</div>
                        <button class="join">JOIN</button>
                    </div>
                `);
                attachJoinHandlers();
            })
            .fail(function(error) {
                console.error('Error:', error);
            });
    });

    function attachJoinHandlers() {
        $('.join').off('click').on('click', function(event) {
            event.preventDefault();
            const inputText = $('#inputText').val();
            if (!inputText.trim()) {
                alert('Please enter text before joining a server.');
                return;
            }

            $(this).prop('disabled', true); // Disable the join button

            const serverJoin = $(this).closest('.server_join');
            const serverIndex = serverJoin.data('index');

            $.get('/servers-data')
                .done(function(jsonData) {
                    const latestServerData = jsonData[serverIndex];

                    if (latestServerData.user1 === inputText || latestServerData.user2 === inputText) {
                        alert('You cannot use the same name as an existing player.');
                        $(this).prop('disabled', false); // Re-enable the join button
                        return;
                    }

                    if (latestServerData.user1 === "") {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                console.log('User1 joined:', data);
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 1
                                }));
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $(this).prop('disabled', false); // Re-enable the join button on failure
                            });
                    } else if (latestServerData.user2 === "") {
                        $.post('/submit', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                console.log('User2 joined:', data);
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    player: 2
                                }));
                                window.location.href = '/warcaby';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $(this).prop('disabled', false); // Re-enable the join button on failure
                            });
                    } else {
                        alert('Server is full or in invalid state');
                        $(this).prop('disabled', false); // Re-enable the join button
                    }
                })
                .fail(function(error) {
                    console.error('Error fetching latest server data:', error);
                    $(this).prop('disabled', false); // Re-enable the join button on failure
                });
        });
    }

    function updateServerList() {
        $.get('/servers-data')
            .done(function(jsonData) {
                console.log('Updating server list:', jsonData);
                $('#servers').empty();
                jsonData.forEach((server, index) => {
                    let joinButton = '';
                    if (server.players < 2) {
                        joinButton = '<button class="join">JOIN</button>';
                    }
                    $('#servers').append(`
                        <div class="server_join" data-index="${index}" data-players="${server.players}">
                            <div class="server">SERVER ${index + 1}</div>
                            ${joinButton}
                        </div>
                    `);
                });
                attachJoinHandlers();
            })
            .fail(function(error) {
                console.error('Error updating server list:', error);
            });
    }

    updateServerList();
    setInterval(updateServerList, 5000); // Update server list every 5 seconds
});
