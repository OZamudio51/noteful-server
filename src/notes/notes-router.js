const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    note_name: xss(note.note_name),
    content: xss(note.content),
    modified: note.modified,
    folder_id: note.folder_id
})

notesRouter
    .route('/')
        .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
        .then(notes => {
            res.json(notes.map(serializeNote))
        })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const {note_name, content, folder_id} = req.body
        const newNote = {note_name, content, folder_id}

        for (const [key, value] of Object.entries(newNote)) 
            if (value == null) 
                return res.status(400).json({
                    error: {message: `Missing '${key} in request body`}
                })
                NotesService.insertNotes(
                    req.app.get('db'),
                    newNote
                )
                .then(note => {
                    res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note))
                })
                // .catch(next)   
                .catch((error) => {
                    console.log(error);
                })
    })
notesRouter
.route('/:id')
    .delete((req, res, next) => {
    console.log(req.params.id);
    NotesService.deleteNotes(req.app.get('db'), req.params.id)
    .then(() => {
        res.status(204).end()
    })
    .catch(next)
    })


module.exports = notesRouter;