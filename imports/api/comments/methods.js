import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

import { Comments } from './comments'

import { isModerator } from '/imports/api/user/methods'

export const newComment = new ValidatedMethod({
    name: 'newComment',
    validate:
        new SimpleSchema({
            parentId: {
                type: String,
                optional: false
            },
            text: {
                type: String,
                max: 1000,
                optional: false
            },
            resourceId: {
                type: String,
                optional: false
            },
            fieldId: {
                type: String,
                optional: true
            },
            type: {
                type: String,
                optional: true
            }
        }).validator({
            clean: true
        }),
    run({ parentId, resourceId, fieldId, text, type }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('Error.', 'You have to be logged in.')
		}

        return Comments.insert({
            parentId: parentId,
            fieldId: fieldId,
            text: text,
            createdAt: new Date().getTime(),
            createdBy: Meteor.userId(),
            resourceId: resourceId,
            type: type || 'comment'
        })
    }
})

export const removeComment = new ValidatedMethod({
    name: 'removeComment',
    validate:
        new SimpleSchema({
            commentId: {
                type: String,
                optional: false
            }
        }).validator(),
    run({ commentId }) {
        let comment = Comments.findOne({
            _id: commentId
        })

        if (!comment) {
            throw new Meteor.Error('Error.', 'Comment doesn\'t exist.')
        }

        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (comment.createdBy !== Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You can\'t remove a comment that you haven\'t posted.')
        }

        // if the comment that's being deleted has children, append the children to the parent comment
        let comments = Comments.find({
            parentId: comment._id
        }).fetch()

        comments.forEach(i => {
            Comments.update({
                _id: i._id
            }, {
                $set: {
                    parentId: comment.parentId
                }
            })
        })

        return Comments.remove({
            _id: commentId
        })
    }
})

export const editComment = new ValidatedMethod({
    name: 'editComment',
    validate:
        new SimpleSchema({
            commentId: {
                type: String,
                optional: false
            },
            text: {
                type: String,
                max: 1000,
                optional: false
            }
        }).validator({
            clean: true
        }),
    run({ commentId, text }) {
        let comment = Comments.findOne({
            _id: commentId
        })

        if (!comment) {
            throw new Meteor.Error('Error.', 'Comment doesn\'t exist.')
        }

        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (comment.createdBy !== Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You can\'t edit a comment that you haven\'t posted.')
        }

        return Comments.update({
            _id: commentId
        }, {
            $set: {
                text: text,
                editedAt: new Date().getTime()
            }
        })
    }
})
