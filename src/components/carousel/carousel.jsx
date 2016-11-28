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
 * @param {object} props React props for component
 * @returns {React.Component} rendered component
 */
var Carousel = function (props) {
    var settings = props.settings || {};
    defaults(settings, {
        centerMode: false,
        dots: false,
        infinite: false,
        lazyLoad: true,
        slidesToShow: 5,
        slidesToScroll: 5,
        variableWidth: true,
        responsive: [{
            breakpoint: frameless.mobile,
            settings: {
                arrows: true,
                slidesToScroll: 1,
                slidesToShow: 1,
                centerMode: true
            }
        }, {
            breakpoint: frameless.tablet,
            settings: {
                slidesToScroll: 2,
                slidesToShow: 2
            }
        }, {
            breakpoint: frameless.desktop,
            settings: {
                slidesToScroll: 4,
                slidesToShow: 4
            }
        }]
    });
    var arrows = props.items.length > settings.slidesToShow;
    var classes = classNames(
        'carousel',
        props.className
    );
    // eslint-plugin-react is confused about what's a stateless component here,
    // so we have to use these props outside to avoid an erroneous no-unused-props
    // and we also have to disable react/display-name below :(
    var {showLoves, showRemixes} = props;
    return (
        <Slider
            arrows={arrows}
            className={classes}
            {... settings}
        >
            {props.items.map(function (item) { // eslint-disable-line react/display-name
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
                    <Thumbnail
                        creator={item.creator}
                        href={href}
                        key={[this.key, item.id].join('.')}
                        loves={item.love_count}
                        remixes={item.remixers_count}
                        showLoves={showLoves}
                        showRemixes={showRemixes}
                        src={item.thumbnail_url}
                        title={item.title}
                        type={item.type}
                    />
                );
            }.bind(this))}
        </Slider>
    );
};
Carousel.propTypes = {
    className: React.PropTypes.string,
    items: React.PropTypes.arrayOf(React.PropTypes.object),
    settings: React.shape({
        /* eslint-disable react/no-unused-prop-types */
        accessibility: React.PropTypes.bool,
        className: React.PropTypes.string,
        adaptiveHeight: React.PropTypes.bool,
        arrows: React.PropTypes.bool,
        nextArrow: React.PropTypes.node,
        prevArrow: React.PropTypes.node,
        autoplay: React.PropTypes.bool,
        autoplaySpeed: React.PropTypes.number,
        centerMode: React.PropTypes.bool,
        customPaging: React.PropTypes.func,
        dots: React.PropTypes.bool,
        dotsClass: React.PropTypes.string,
        draggable: React.PropTypes.bool,
        fade: React.PropTypes.bool,
        focusOnSelect: React.PropTypes.bool,
        infinite: React.PropTypes.bool,
        initialSlide: React.PropTypes.number,
        lazyLoad: React.PropTypes.bool,
        pauseOnHover: React.PropTypes.bool,
        responsive: React.PropTypes.array,
        rtl: React.PropTypes.bool,
        slidesToShow: React.PropTypes.number,
        slidesToScroll: React.PropTypes.number,
        swipeToSlide: React.PropTypes.bool,
        useCSS: React.PropTypes.bool,
        vertical: React.PropTypes.bool,
        afterChange: React.PropTypes.func,
        beforeChange: React.PropTypes.func,
        slickGoTo: React.PropTypes.number
        /* eslint-enable react/no-unused-prop-types */

    }),
    showLoves: React.PropTypes.bool,
    showRemixes: React.PropTypes.bool
};
Carousel.defaultProps = {
    items: require('./carousel.json'),
    showRemixes: false,
    showLoves: false
};
module.exports = Carousel;
