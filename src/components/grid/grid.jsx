var classNames = require('classnames');
var React = require('react');

var Thumbnail = require('../thumbnail/thumbnail.jsx');
var FlexRow = require('../flex-row/flex-row.jsx');

require('./grid.scss');

var Grid = function (props) {
    var classes = classNames(
        'grid',
        props.className
    );
    return (
        <div className={classes}>
            <FlexRow>
                {props.items.map(function (item) { // eslint-disable-line react/display-name
                    var href = '/' + props.itemType + '/' + item.id + '/';
                    if (props.itemType === 'projects') {
                        return (
                            <Thumbnail
                                avatar={'https://cdn2.scratch.mit.edu/get_image/user/' + item.author.id + '_32x32.png'}
                                creator={item.author.username}
                                favorites={item.stats.favorites}
                                href={href}
                                key={item.id}
                                loves={item.stats.loves}
                                remixes={item.stats.remixes}
                                showAvatar={props.showAvatar}
                                showFavorites={props.showFavorites}
                                showLoves={props.showLoves}
                                showRemixes={props.showRemixes}
                                showViews={props.showViews}
                                src={item.image}
                                title={item.title}
                                type={'project'}
                                views={item.stats.views}
                            />
                        );
                    }
                    return (
                        <Thumbnail
                            href={href}
                            key={item.id}
                            owner={item.owner}
                            src={item.image}
                            title={item.title}
                            type={'gallery'}
                        />
                    );
                })}
            </FlexRow>
        </div>
    );
};
Grid.propTypes = {
    className: React.PropTypes.string,
    itemType: React.PropTypes.string,
    items: React.PropTypes.arrayOf(React.PropTypes.object)
};
Grid.defaultProps = {
    items: require('./grid.json'),
    itemType: 'projects',
    showLoves: false,
    showFavorites: false,
    showRemixes: false,
    showViews: false,
    showAvatar: false
};
module.exports = Grid;
