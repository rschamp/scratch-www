var injectIntl = require('react-intl').injectIntl;
var omit = require('lodash.omit');
var React = require('react');
var render = require('../../lib/render.jsx');

var Api = require('../../mixins/api.jsx');
var Session = require('../../mixins/session.jsx');

var Activity = require('../../components/activity/activity.jsx');
var AdminPanel = require('../../components/adminpanel/adminpanel.jsx');
var Banner = require('../../components/banner/banner.jsx');
var Box = require('../../components/box/box.jsx');
var Button = require('../../components/forms/button.jsx');
var Carousel = require('../../components/carousel/carousel.jsx');
var Intro = require('../../components/intro/intro.jsx');
var Modal = require('../../components/modal/modal.jsx');
var News = require('../../components/news/news.jsx');
var Welcome = require('../../components/welcome/welcome.jsx');

require('./splash.scss');

var Splash = injectIntl(React.createClass({
    type: 'Splash',
    mixins: [
        Api,
        Session
    ],
    getInitialState: function () {
        return {
            projectCount: 10569070,
            activity: [], // recent social actions taken by users someone is following
            news: [], // gets news posts from the scratch Tumblr
            featuredCustom: {}, // custom homepage rows, such as "Projects by Scratchers I'm Following"
            featuredGlobal: {}, // global homepage rows, such as "Featured Projects"
            showEmailConfirmationModal: false, // flag that determines whether to show banner to request email conf.
            refreshCacheStatus: 'notrequested'
        };
    },
    componentDidUpdate: function (prevProps, prevState) {
        if (this.state.session.user != prevState.session.user) {
            if (this.state.session.user) {
                this.getActivity();
                this.getFeaturedCustom();
                this.getNews();
            } else {
                this.setState({featuredCustom: []});
                this.setState({activity: []});
                this.setState({news: []});
                this.getProjectCount();
            }
            if (this.shouldShowEmailConfirmation()) {
                window.addEventListener('message', this.onMessage);
            } else {
                window.removeEventListener('message', this.onMessage);
            }
        }
    },
    componentDidMount: function () {
        this.getFeaturedGlobal();
        if (this.state.session.user) {
            this.getActivity();
            this.getFeaturedCustom();
            this.getNews();
        } else {
            this.getProjectCount();
        }
        if (this.shouldShowEmailConfirmation()) window.addEventListener('message', this.onMessage);
    },
    componentWillUnmount: function () {
        window.removeEventListener('message', this.onMessage);
    },
    onMessage: function (e) {
        if (e.origin != window.location.origin) return;
        if (e.source != this.refs.emailConfirmationiFrame.contentWindow) return;
        if (e.data == 'resend-done') {
            this.hideEmailConfirmationModal();
        } else {
            var data = JSON.parse(e.data);
            if (data['action'] === 'leave-page') {
                window.location.href = data['uri'];
            }
        }
    },
    getActivity: function () {
        this.api({
            uri: '/proxy/users/' + this.state.session.user.username + '/activity?limit=5'
        }, function (err, body) {
            if (!err) this.setState({activity: body});
        }.bind(this));
    },
    getFeaturedGlobal: function () {
        this.api({
            uri: '/proxy/featured'
        }, function (err, body) {
            if (!err) this.setState({featuredGlobal: body});
        }.bind(this));
    },
    getFeaturedCustom: function () {
        this.api({
            uri: '/proxy/users/' + this.state.session.user.id + '/featured'
        }, function (err, body) {
            if (!err) this.setState({featuredCustom: body});
        }.bind(this));
    },
    getNews: function () {
        this.api({
            uri: '/news?limit=3'
        }, function (err, body) {
            if (!err) this.setState({news: body});
        }.bind(this));
    },
    getProjectCount: function () {
        this.api({
            uri: '/projects/count/all'
        }, function (err, body) {
            if (!err) this.setState({projectCount: body.count});
        }.bind(this));
    },
    refreshHomepageCache: function () {
        this.api({
            host: '',
            uri: '/scratch_admin/homepage/clear-cache/',
            method: 'post',
            useCsrf: true
        }, function (err, body) {
            if (err) return this.setState({refreshCacheStatus: 'fail'});
            if (!body.success) return this.setState({refreshCacheStatus: 'inprogress'});
            return this.setState({refreshCacheStatus: 'pass'});
        }.bind(this));
    },
    getHomepageRefreshStatus: function () {
        var status = {
            status: this.state.refreshCacheStatus,
            disabled: false,
            content: 'Refresh'
        };
        if (this.state.refreshCacheStatus === 'inprogress') {
            status.disabled = true;
            status.content = 'In Progress';
        } else if (this.state.refreshCacheStatus === 'pass') {
            status.disabled = true;
            status.content = 'Requested';
        } else if (this.state.refreshCacheStatus == 'fail') {
            status.disabled = false;
            status.content = 'Error';
        }
        return status;
    },
    showEmailConfirmationModal: function () {
        this.setState({emailConfirmationModalOpen: true});
    },
    hideEmailConfirmationModal: function () {
        this.setState({emailConfirmationModalOpen: false});
    },
    handleDismiss: function (cue) {
        this.api({
            host: '',
            uri: '/site-api/users/set-template-cue/',
            method: 'post',
            useCsrf: true,
            json: {cue: cue, value: false}
        }, function (err) {
            if (!err) window.refreshSession();
        });
    },
    shouldShowWelcome: function () {
        if (!this.state.session.user || !this.state.session.flags.show_welcome) return false;
        return (
            new Date(this.state.session.user.dateJoined) >
            new Date(new Date - 2*7*24*60*60*1000) // Two weeks ago
        );
    },
    shouldShowEmailConfirmation: function () {
        return (
            this.state.session.user && this.state.session.flags.has_outstanding_email_confirmation &&
            this.state.session.flags.confirm_email_banner);
    },
    renderHomepageRows: function () {
        var formatMessage = this.props.intl.formatMessage;

        var rows = [
            <Box
                    title={formatMessage({
                        id: 'splash.featuredProjects',
                        defaultMessage: 'Featured Projects'})}
                    key="community_featured_projects">
                <Carousel items={this.state.featuredGlobal.community_featured_projects} />
            </Box>,
            <Box
                    title={formatMessage({
                        id: 'splash.featuredStudios',
                        defaultMessage: 'Featured Studios'})}
                    key="community_featured_studios">
                <Carousel items={this.state.featuredGlobal.community_featured_studios}
                          settings={{slidesToShow: 4, slidesToScroll: 4, lazyLoad: false}} />
            </Box>
        ];

        if (this.state.featuredGlobal.curator_top_projects &&
            this.state.featuredGlobal.curator_top_projects.length > 4) {
            
            rows.push(
                <Box
                        key="curator_top_projects"
                        title={
                            'Projects Curated by ' +
                            this.state.featuredGlobal.curator_top_projects[0].curator_name}
                        moreTitle={formatMessage({id: 'general.learnMore', defaultMessage: 'Learn More'})}
                        moreHref="/studios/386359/">
                    <Carousel
                        items={this.state.featuredGlobal.curator_top_projects} />
                </Box>
            );
        }

        if (this.state.featuredGlobal.scratch_design_studio &&
            this.state.featuredGlobal.scratch_design_studio.length > 4) {
            
            rows.push(
                <Box
                        key="scratch_design_studio"
                        title={
                            formatMessage({
                                id: 'splash.scratchDesignStudioTitle',
                                defaultMessage: 'Scratch Design Studio' })
                            + ' - ' + this.state.featuredGlobal.scratch_design_studio[0].gallery_title}
                        moreTitle={formatMessage({id: 'splash.visitTheStudio', defaultMessage: 'Visit the studio'})}
                        moreHref={'/studios/' + this.state.featuredGlobal.scratch_design_studio[0].gallery_id + '/'}>
                    <Carousel
                        items={this.state.featuredGlobal.scratch_design_studio} />
                </Box>
            );
        }

        if (this.state.session.user &&
            this.state.featuredGlobal.community_newest_projects &&
            this.state.featuredGlobal.community_newest_projects.length > 0) {
            
            rows.push(
                <Box
                        title={
                            formatMessage({
                                id: 'splash.recentlySharedProjects',
                                defaultMessage: 'Recently Shared Projects' })}
                        key="community_newest_projects">
                    <Carousel
                        items={this.state.featuredGlobal.community_newest_projects} />
                </Box>
            );
        }

        if (this.state.featuredCustom.custom_projects_by_following &&
            this.state.featuredCustom.custom_projects_by_following.length > 0) {
            
            rows.push(
                <Box title={
                            formatMessage({
                                id: 'splash.projectsByScratchersFollowing',
                                defaultMessage: 'Projects by Scratchers I\'m Following'})}
                     key="custom_projects_by_following">
                    
                    <Carousel items={this.state.featuredCustom.custom_projects_by_following} />
                </Box>
            );
        }
        if (this.state.featuredCustom.custom_projects_loved_by_following &&
            this.state.featuredCustom.custom_projects_loved_by_following.length > 0) {

            rows.push(
                <Box title={
                            formatMessage({
                                id: 'splash.projectsLovedByScratchersFollowing',
                                defaultMessage: 'Projects Loved by Scratchers I\'m Following'})}
                     key="custom_projects_loved_by_following">
                    
                    <Carousel items={this.state.featuredCustom.custom_projects_loved_by_following} />
                </Box>
            );
        }

        if (this.state.featuredCustom.custom_projects_in_studios_following &&
            this.state.featuredCustom.custom_projects_in_studios_following.length > 0) {
            
            rows.push(
                <Box title={
                            formatMessage({
                                id:'splash.projectsInStudiosFollowing',
                                defaultMessage: 'Projects in Studios I\'m Following'})}
                     key="custom_projects_in_studios_following">
                    
                    <Carousel items={this.state.featuredCustom.custom_projects_in_studios_following} />
                </Box>
            );
        }

        rows.push(
            <Box title={
                        formatMessage({
                            id: 'splash.communityRemixing',
                            defaultMessage: 'What the Community is Remixing' })}
                 key="community_most_remixed_projects">
                
                <Carousel items={this.state.featuredGlobal.community_most_remixed_projects} showRemixes={true} />
            </Box>,
            <Box title={
                        formatMessage({
                            id: 'splash.communityLoving',
                            defaultMessage: 'What the Community is Loving' })}
                 key="community_most_loved_projects">
                
                <Carousel items={this.state.featuredGlobal.community_most_loved_projects} showLoves={true} />
            </Box>
        );

        return rows;
    },
    render: function () {
        var featured = this.renderHomepageRows();
        var emailConfirmationStyle = {width: 500, height: 330, padding: 1};
        var homepageCacheState = this.getHomepageRefreshStatus();

        var formatMessage = this.props.intl.formatMessage;
        var formatHTMLMessage = this.props.intl.formatHTMLMessage;
        var messages = {
            'general.viewAll': formatMessage({id: 'general.viewAll'}),
            'news.scratchNews': formatMessage({id: 'news.scratchNews'}),
            'welcome.welcomeToScratch': formatMessage({id: 'welcome.welcomeToScratch'}),
            'welcome.learn': formatMessage({id: 'welcome.learn'}),
            'welcome.tryOut': formatMessage({id: 'welcome.tryOut'}),
            'welcome.connect': formatMessage({id: 'welcome.connect'}),
            'intro.aboutScratch': formatMessage({id: 'intro.aboutScratch'}),
            'intro.forEducators': formatMessage({id: 'intro.forEducators'}),
            'intro.forParents': formatMessage({id: 'intro.forParents'}),
            'intro.joinScratch': formatMessage({id: 'intro.joinScratch'}),
            'intro.seeExamples': formatMessage({id: 'intro.seeExamples'}),
            'intro.tagLine': formatHTMLMessage({id: 'intro.tagLine'}),
            'intro.tryItOut': formatMessage({id: 'intro.tryItOut'})
        };

        return (
            <div className="splash">
                {this.shouldShowEmailConfirmation() ? [
                    <Banner key="confirmedEmail"
                            className="warning"
                            onRequestDismiss={this.handleDismiss.bind(this, 'confirmed_email')}>
                        <a href="#" onClick={this.showEmailConfirmationModal}>Confirm your email</a>
                        {' '}to enable sharing.{' '}
                        <a href="/info/faq/#accounts">Having trouble?</a>
                    </Banner>,
                    <Modal key="emailConfirmationModal"
                           isOpen={this.state.emailConfirmationModalOpen}
                           onRequestClose={this.hideEmailConfirmationModal}
                           style={{content: emailConfirmationStyle}}>
                        <iframe ref="emailConfirmationiFrame"
                                src="/accounts/email_resend_standalone/"
                                {...omit(emailConfirmationStyle, 'padding')} />
                    </Modal>
                ] : []}
                <div key="inner" className="inner">
                    {this.state.session.user ? [
                        <div key="header" className="splash-header">
                            {this.shouldShowWelcome() ? [
                                <Welcome key="welcome"
                                         onDismiss={this.handleDismiss.bind(this, 'welcome')}
                                         messages={messages} />
                            ] : [
                                <Activity key="activity" items={this.state.activity} />
                            ]}
                            <Box className="fools"
                                 title="Scratch Cat goes on Vacation">
                                <img src="/images/vacation.png" />
                                <div className="button-row">
                                    <a className="button" href="/tbd">Where is Scratch Cat?</a>
                                    <a className="button" href="/users/scratchcat/">Scratch Cat's Profile</a>
                                </div>
                            </Box>
                        </div>
                    ] : [
                        <Intro projectCount={this.state.projectCount} messages={messages} key="intro"/>
                    ]}

                    {featured}

                    <AdminPanel>
                        <dt>Tools</dt>
                        <dd>
                            <ul>
                                <li>
                                    <a href="/scratch_admin/tickets">Ticket Queue</a>
                                </li>
                                <li>
                                    <a href="/scratch_admin/ip-search/">IP Search</a>
                                </li>
                                <li>
                                    <a href="/scratch_admin/email-search/">Email Search</a>
                                </li>
                            </ul>
                        </dd>
                        <dt>Homepage Cache</dt>
                        <dd>
                            <ul className="cache-list">
                                <li>
                                    <div className="button-row">
                                        <span>Refresh row data:</span>
                                        <Button onClick={this.refreshHomepageCache}
                                                className={homepageCacheState.status}
                                                disabled={homepageCacheState.disabled}>
                                            <span>{homepageCacheState.content}</span>
                                        </Button>
                                    </div>
                                </li>
                            </ul>
                        </dd>
                    </AdminPanel>
                </div>
            </div>
        );
    }
}));

render(<Splash />, document.getElementById('view'));
