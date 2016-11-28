/* eslint-disable react/no-danger */
var React = require('react');
var ReactIntl = require('react-intl');
var defineMessages = ReactIntl.defineMessages;
var FormattedMessage = ReactIntl.FormattedMessage;
var FormattedRelative = ReactIntl.FormattedRelative;
var injectIntl = ReactIntl.injectIntl;

var Box = require('../box/box.jsx');

require('./activity.scss');

var defaultMessages = defineMessages({
    whatsHappening: {
        id: 'general.whatsHappening'
    }
});

var Activity = function (props) {
    var formatMessage = props.intl.formatMessage;
    return (
        <Box
            className="activity"
            title={formatMessage(defaultMessages.whatsHappening)}
        >

            {props.items && props.items.length > 0 ? [
                <ul key="activity-ul">
                    {props.items.map(function (item) {
                        if (item.message.replace(/\s/g, '')) {
                            var actorProfileUrl = '/users/' + item.actor.username + '/';
                            var actionDate = new Date(item.datetime_created + 'Z');
                            var activityMessageHTML = (
                                '<a href=' + actorProfileUrl + '>' + item.actor.username + '</a>' +
                                item.message
                            );
                            return (
                                <li key={item.pk}>
                                    <a href={actorProfileUrl}>
                                        <img
                                            alt=""
                                            height="34"
                                            src={item.actor.thumbnail_url}
                                            width="34"
                                        />
                                        <p dangerouslySetInnerHTML={{__html: activityMessageHTML}} />
                                        <p>
                                            <span className="stamp">
                                                <FormattedRelative value={actionDate} />
                                            </span>
                                        </p>
                                    </a>
                                </li>
                            );
                        }
                    })}
                </ul>
            ] : [
                <div
                    className="empty"
                    key="activity-empty"
                >
                    <h4>
                        <FormattedMessage
                            defaultMessage="This is where you will see updates from Scratchers you follow"
                            id="activity.seeUpdates"
                        />
                    </h4>
                    <a href="/studios/146521/">
                        <FormattedMessage
                            defaultMessage="Check out some Scratchers you might like to follow"
                            id="activity.checkOutScratchers"
                        />
                    </a>
                </div>
            ]}
        </Box>
    );
};

Activity.propTypes = {
    items: React.PropTypes.arrayOf(React.PropTypes.object)
};

Activity.defaultProps = {
    items: require('./activity.json')
};

module.exports = injectIntl(Activity);
