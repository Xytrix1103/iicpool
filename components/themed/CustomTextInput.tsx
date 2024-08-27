import { TextInput, TextInputProps } from 'react-native-paper'

const CustomTextInput = (props: TextInputProps) => {
	return (
		<TextInput
			mode="outlined"
			{...props}
		/>
	)
}

export default CustomTextInput
