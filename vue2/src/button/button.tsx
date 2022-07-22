import { Watch, Prop } from 'vue-property-decorator';
import Vue from 'vue'
import Component from 'vue-class-component'

function bem(name: string) {
    return `button__${name}`
}

interface AvatarType {
    living?: boolean;
    following?: boolean;
    headurl?: string;
    user_id?: string | number;
}

@Component({})
export default class Button extends Vue {
    @Prop(String)
    img?: string;

    @Prop(String)
    avatarClass?: string;

    @Prop({
        type: [String, Number],
        default: '',
    })
    uid!: string | number;

    @Prop({
        type: Boolean,
        default: false,
    })
    living!: boolean;

    @Prop({
        type: Boolean,
        default: false,
    })
    following!: boolean;

    @Prop({
        type: String,
        default: '100px',
    })
    width!: string;

    @Prop({
        type: String,
        default: '100px',
    })
    height!: string;

    @Prop({
        type: Boolean,
        default: true,
    })
    liveIconShow!: boolean;

    @Prop({
        type: String,
        default:
            'https://static.yximgs.com/udata/pkg/KS-GAME-WEB/live_icon.fc6629e973ae3a85.png',
    })
    liveIcon!: string;

    @Prop({
        type: Boolean,
        default: false,
    })
    needGetInfo!: boolean;

    @Prop(String)
    baseUrl?: string;

    @Prop({
        type: String,
        default: 'test',
    })
    env!: string;

    @Prop(Function)
    click?: Function;

    @Prop(Function)
    getUserInfoCb?: Function;

    @Prop({
        type: String,
        default:
            'https://ali2.a.kwimgs.com/udata/pkg/KS-GAME-WEB/default_header.52324eb1bb302030.png',
    })
    defaultAvatar!: string;

    public avatar: AvatarType = {
        living: false,
        following: false,
        headurl: '',
        user_id: '',
    };

    @Watch('uid')
    onChangeUid() {
        this.getUserInfo();
    }

    created() {
        this.avatar.living = this.living;
        this.avatar.following = this.following;

        this.getUserInfo();
    }

    get requestUrl() {
        return this.baseUrl;
    }

    async getUserInfo() {
        if (!this.uid || !this.needGetInfo) return;
        try {
            this.$emit('getUserInfoCb', this.avatar);
        } catch (error) {
            this.$emit('error', error);
        }
    }

    toProfile() {}

    onClick() {
        if (this.click && this.click(this.avatar)) return;
        if (!this.uid) return;

        if (this.avatar.living) {
            return;
        }
        // 跳转个人页
        this.toProfile();
    }

    onError(e: Event) {
        const target = e.target as HTMLImageElement;
        target.src = this.defaultAvatar;
        target.onerror = null;
    }

    render() {
        const style = {
            width: this.width,
            height: this.height,
        };
        const liveIcon = () => {
            if (this.liveIconShow && this.avatar.living) {
                return (<img class={bem('live-icon')} src={this.liveIcon} />);
            }
        };
        return (
            <div
                style={style}
                onClick={this.onClick}
                class={[
                    this.avatarClass,
                ]}
            >
                <div class={bem('content')}>
                    <slot></slot>
                    <slot name="header"></slot>
                </div>
                {liveIcon()}
            </div>
        );
    }
}
