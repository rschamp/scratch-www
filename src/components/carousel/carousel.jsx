var classNames = require('classnames');
var defaults = require('lodash.defaults');
var React = require('react');
var Slider = require('react-slick');

var Thumbnail = require('../thumbnail/thumbnail.jsx');

var frameless = require('../../lib/frameless.js');

require('slick-carousel/slick/slick.scss');
require('slick-carousel/slick/slick-theme.scss');
require('./carousel.scss');

/**
 * Displays content in horizontal scrolling box. Example usage: splash page rows.
 */
var Carousel = React.createClass({
    type: 'Carousel',
    propTypes: {
        items: React.PropTypes.array
    },
    getDefaultProps: function () {
        return {
            items: require('./carousel.json'),
            showRemixes: false,
            showLoves: false
        };
    },
    render: function () {
        var settings = this.props.settings || {};
        defaults(settings, {
            centerMode: false,
            dots: false,
            infinite: false,
            lazyLoad: true,
            slidesToShow: 5,
            slidesToScroll: 5,
            variableWidth: true,
            responsive: [
                {breakpoint: frameless.mobile, settings: {
                    arrows: true,
                    slidesToScroll: 1,
                    slidesToShow: 1,
                    centerMode: true
                }},
                {breakpoint: frameless.tablet, settings: {
                    slidesToScroll: 2,
                    slidesToShow: 2
                }},
                {breakpoint: frameless.desktop, settings: {
                    slidesToScroll: 4,
                    slidesToShow: 4
                }}
            ]
        });
        var arrows = this.props.items.length > settings.slidesToShow;
        var classes = classNames(
            'carousel',
            this.props.className
        );
        return (
            <Slider className={classes} arrows={arrows} {... settings}>
                {this.props.items.map(function (item) {
                    var href = '';
                    switch (item.type) {
                    case 'gallery':
                        href = '/studios/' + item.id + '/';
                        break;
                    case 'project':
                        href = '/projects/' + item.id + '/';
                        break;
                    default:
                        href = '/' + item.type + '/' + item.id + '/';
                    }

                    return (
                        <Thumbnail key={[this.key, item.id].join('.')}
                            showLoves={this.props.showLoves}
                            showRemixes={this.props.showRemixes}
                            type={item.type}
                            href={href}
                            title={item.title}
                            src={item.thumbnail_url}
                            creator={item.creator}
                            remixes={item.remixers_count}
                            loves={item.love_count}
                        />
                    );
                }.bind(this))}
            </Slider>
        );
    }
});

module.exports = Carousel;
