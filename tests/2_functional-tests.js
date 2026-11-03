const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  const board = 'fcc_test_' + Date.now();
  let threadId;
  let replyId;
  const threadPassword = 'thread-pass';
  const replyPassword = 'reply-pass';

  suite('API ROUTING FOR /api/threads/:board', function() {
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/' + board)
        .send({ text: 'test thread', delete_password: threadPassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/' + board)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 1);
          threadId = res.body[0]._id;
          assert.notProperty(res.body[0], 'delete_password');
          assert.notProperty(res.body[0], 'reported');
          assert.isAtMost(res.body[0].replies.length, 3);
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/' + board)
        .send({ thread_id: threadId, delete_password: 'wrong' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/' + board)
        .send({ report_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/' + board)
        .send({ thread_id: threadId, text: 'test reply', delete_password: replyPassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/' + board)
        .query({ thread_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, threadId);
          assert.isArray(res.body.replies);
          assert.isAtLeast(res.body.replies.length, 1);
          replyId = res.body.replies[0]._id;
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/' + board)
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/' + board)
        .send({ thread_id: threadId, reply_id: replyId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/' + board)
        .send({ thread_id: threadId, reply_id: replyId, delete_password: replyPassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/' + board)
        .send({ thread_id: threadId, delete_password: threadPassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});
