'use strict';

module.exports = function (app) {
  const mongoose = require('mongoose');

  const replySchema = new mongoose.Schema({
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    created_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false }
  }, { versionKey: false });

  const threadSchema = new mongoose.Schema({
    board: { type: String, required: true, index: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false },
    replies: { type: [replySchema], default: [] }
  }, { versionKey: false });

  const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema);

  function publicReply(reply) {
    return {
      _id: reply._id,
      text: reply.text,
      created_on: reply.created_on
    };
  }

  function publicThread(thread) {
    return {
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: thread.replies
        .slice()
        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
        .slice(0, 3)
        .map(publicReply)
    };
  }

  app.route('/api/threads/:board')
    .post(async function(req, res) {
      const board = req.params.board;
      const now = new Date();
      await Thread.create({
        board: board,
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on: now,
        bumped_on: now,
        reported: false,
        replies: []
      });
      res.sendStatus(200);
    })
    .get(async function(req, res) {
      const threads = await Thread.find({ board: req.params.board }).limit(10);
      threads.sort((a, b) => new Date(b.bumped_on) - new Date(a.bumped_on));
      threads.forEach(function(thread) { thread.replies.sort((a, b) => new Date(b.created_on) - new Date(a.created_on)); });
      const response = threads.map(publicThread);
      res.json(response);
    })
    .delete(async function(req, res) {
      const thread = await Thread.findOne({ _id: req.body.thread_id, board: req.params.board });
      if (!thread) return res.send('incorrect password');
      if (thread.delete_password !== req.body.delete_password) {
        return res.send('incorrect password');
      }
      thread.text = '[deleted]';
      await thread.save();
      res.send('success');
    })
    .put(async function(req, res) {
      const id = req.body.report_id || req.body.thread_id;
      const thread = await Thread.findOne({ _id: id, board: req.params.board });
      if (!thread) return res.send('not found');
      thread.reported = true;
      await thread.save();
      res.send('reported');
    });

  app.route('/api/replies/:board')
    .post(async function(req, res) {
      const thread = await Thread.findOne({ _id: req.body.thread_id, board: req.params.board });
      if (!thread) return res.send('not found');
      const now = new Date();
      thread.replies.push({
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on: now,
        reported: false
      });
      thread.bumped_on = now;
      await thread.save();
      res.sendStatus(200);
    })
    .get(async function(req, res) {
      const thread = await Thread.findOne({ _id: req.query.thread_id, board: req.params.board });
      if (!thread) return res.json({});
      res.json({
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies
          .slice()
          .sort((a, b) => new Date(a.created_on) - new Date(b.created_on))
          .map(publicReply)
      });
    })
    .delete(async function(req, res) {
      const thread = await Thread.findOne({ _id: req.body.thread_id, board: req.params.board });
      if (!thread) return res.send('incorrect password');
      const reply = thread.replies.find(item => String(item._id) === String(req.body.reply_id));
      if (!reply || reply.delete_password !== req.body.delete_password) {
        return res.send('incorrect password');
      }
      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    })
    .put(async function(req, res) {
      const thread = await Thread.findOne({ _id: req.body.thread_id, board: req.params.board });
      if (!thread) return res.send('not found');
      const reply = thread.replies.find(item => String(item._id) === String(req.body.reply_id));
      if (!reply) return res.send('not found');
      reply.reported = true;
      await thread.save();
      res.send('reported');
    });
};
