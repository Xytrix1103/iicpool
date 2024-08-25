type Profile = {
	roles: Role[];
	full_name: string;
	mobile_number: string;
	photo_url: string;
	deleted: boolean;
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}


export {
	Profile,
	Role,
}
