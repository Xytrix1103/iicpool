import CustomLayout from '../components/themed/CustomLayout'
import CustomFlex from '../components/themed/CustomFlex'
import CustomHeading from '../components/themed/CustomHeading'

const Profile = () => {
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
		>
			<CustomFlex>
				<CustomHeading>
					Profile
				</CustomHeading>
			</CustomFlex>
		</CustomLayout>
	)
}

export default Profile
