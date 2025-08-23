const { google } = require('googleapis');

class YouTubeService {
    constructor() {
        this.oauth2Client = null;
        this.youtube = null;
        this._initAuth();
    }

    _initAuth() {
        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
        const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !redirectUri) {
            return;
        }

        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        if (refreshToken) {
            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        }
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
    }

    isAuthenticated() {
        return Boolean(this.oauth2Client && (this.oauth2Client.credentials?.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN));
    }

    generateAuthUrl() {
        if (!this.oauth2Client) {
            this._initAuth();
        }
        if (!this.oauth2Client) {
            throw new Error('Thiếu cấu hình OAuth (YOUTUBE_CLIENT_ID/SECRET/REDIRECT_URI).');
        }
        const scopes = [
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ];
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes
        });
    }

    async exchangeCodeForTokens(code) {
        if (!this.oauth2Client) {
            this._initAuth();
        }
        if (!this.oauth2Client) {
            throw new Error('Thiếu cấu hình OAuth (YOUTUBE_CLIENT_ID/SECRET/REDIRECT_URI).');
        }
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
        return tokens;
    }

    async createLiveStream(classData) {
        if (!this.youtube || !this.isAuthenticated()) {
            throw new Error('YouTube chưa được kết nối. Hãy vào trang kết nối để cấp quyền.');
        }

        const title = `${classData.class_name} - ${classData.course_id.title}`;
        const description = `Livestream cho lớp ${classData.class_name}\n\n${classData.description || ''}`;
        const privacy = classData?.livestream?.privacy || 'unlisted';

        const broadcastRes = await this.youtube.liveBroadcasts.insert({
            part: ['snippet', 'status', 'contentDetails'],
            requestBody: {
                snippet: {
                    title: title,
                    description: description,
                    scheduledStartTime: new Date().toISOString()
                },
                status: { privacyStatus: privacy },
                contentDetails: { enableAutoStart: true, enableAutoStop: true }
            }
        });
        const broadcast = broadcastRes.data;

        const streamRes = await this.youtube.liveStreams.insert({
            part: ['snippet', 'cdn', 'contentDetails'],
            requestBody: {
                snippet: { title: title },
                cdn: {
                    ingestionType: 'rtmp',
                    frameRate: 'variable',
                    resolution: 'variable'
                },
                contentDetails: { isReusable: true }
            }
        });
        const stream = streamRes.data;

        await this.youtube.liveBroadcasts.bind({
            part: ['id', 'snippet', 'contentDetails', 'status'],
            id: broadcast.id,
            streamId: stream.id
        });

        const ingestion = stream?.cdn?.ingestionInfo || {};
        return {
            broadcastId: broadcast.id,
            streamId: stream.id,
            streamKey: ingestion.streamName || '',
            youtubeUrl: `https://www.youtube.com/watch?v=${broadcast.id}`,
            embedUrl: `https://www.youtube.com/embed/${broadcast.id}`
        };
    }

    async startLiveStream(broadcastId) {
        if (!this.youtube || !this.isAuthenticated()) {
            throw new Error('YouTube chưa được kết nối.');
        }
        await this.youtube.liveBroadcasts.transition({
            part: ['id', 'status'],
            id: broadcastId,
            broadcastStatus: 'live'
        });
        return { id: broadcastId, status: 'live' };
    }

    async stopLiveStream(broadcastId) {
        if (!this.youtube || !this.isAuthenticated()) {
            throw new Error('YouTube chưa được kết nối.');
        }
        await this.youtube.liveBroadcasts.transition({
            part: ['id', 'status'],
            id: broadcastId,
            broadcastStatus: 'complete'
        });
        return { id: broadcastId, status: 'complete' };
    }

    async getLiveStreamInfo(broadcastId) {
        if (!this.youtube || !this.isAuthenticated()) {
            return {
                id: broadcastId,
                status: { lifeCycleStatus: 'not_configured' },
                statistics: { viewCount: 0, likeCount: 0 }
            };
        }
        const res = await this.youtube.liveBroadcasts.list({
            id: [broadcastId],
            part: ['id', 'snippet', 'status', 'contentDetails', 'statistics', 'liveStreamingDetails']
        });
        // const res = await youtube.videos.list({
        //     id: youtubeVideoId,
        //     part: 'id,snippet,statistics,liveStreamingDetails'
        //   })
          
        return res.data.items?.[0] || null;
    }

    async getChatMessages(liveChatId, maxResults = 200) {
        if (!this.youtube || !this.isAuthenticated()) {
            return { items: [], pollingIntervalMillis: 5000 };
        }
        const res = await this.youtube.liveChatMessages.list({
            liveChatId,
            part: ['id', 'snippet', 'authorDetails'],
            maxResults
        });
        return res.data;
    }

    async sendChatMessage(liveChatId, message) {
        if (!this.youtube || !this.isAuthenticated()) {
            throw new Error('YouTube chưa được kết nối.');
        }
        const res = await this.youtube.liveChatMessages.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    liveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: { messageText: message }
                }
            }
        });
        return res.data;
    }

    // Xóa broadcast và stream đã bind (nếu có)
    async deleteLiveBroadcastAndStream(broadcastId) {
        if (!this.youtube || !this.isAuthenticated()) {
            throw new Error('YouTube chưa được kết nối.');
        }
        // Lấy boundStreamId nếu có
        let boundStreamId = null;
        try {
            const info = await this.youtube.liveBroadcasts.list({
                id: [broadcastId],
                part: ['id', 'contentDetails']
            });
            boundStreamId = info.data.items?.[0]?.contentDetails?.boundStreamId || null;
        } catch {}

        // Xóa broadcast
        try {
            await this.youtube.liveBroadcasts.delete({ id: broadcastId });
        } catch (err) {
            // Nếu broadcast đã bị xóa hoặc không tồn tại, bỏ qua lỗi
            if (err && err.code !== 404) {
                throw err;
            }
        }

        // Xóa stream nếu có
        if (boundStreamId) {
            try {
                await this.youtube.liveStreams.delete({ id: boundStreamId });
            } catch (err) {
                if (err && err.code !== 404) {
                    // Không chặn reset vì lỗi xóa stream
                    console.warn('Cannot delete live stream:', err.message || err);
                }
            }
        }

        return { deletedBroadcastId: broadcastId, deletedStreamId: boundStreamId };
    }

    async handleAuthCallback(code) {
        if (!this.oauth2Client) {
            this._initAuth();
        }
        if (!this.oauth2Client) {
            throw new Error('Thiếu cấu hình OAuth');
        }

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            
            // Lưu refresh token để sử dụng sau này
            if (tokens.refresh_token) {
                // Có thể lưu vào database hoặc env
                console.log('Refresh token received:', tokens.refresh_token);
            }
            
            return tokens;
        } catch (error) {
            console.error('Error handling auth callback:', error);
            throw new Error('Không thể xử lý callback xác thực');
        }
    }
}

module.exports = new YouTubeService();
