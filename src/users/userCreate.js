import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    ReferenceInput,
    SelectInput,
    required,
    ImageInput,
    ImageField,
    FormDataConsumer,
    BooleanInput
} from 'react-admin';
import {connect} from 'react-redux';
import './userStyles.scss';
import {useForm} from 'react-final-form';
import { DateInput } from 'react-admin-date-inputs';

const ProvinceInput = ({formData, ...rest}) => {
    const form = useForm();
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('address.city', null);
                                 rest.input.onChange(value);
                             },
                         }}
    />);
};

const CountryInput = ({formData, ...rest}) => {
    const form = useForm();
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('address.province', null);
                                 form.change('address.city', null);
                                 rest.input.onChange(value);
                             },
                         }}
    />);
};

const RoleInput = ({formData, ...rest}) => {
    const form = useForm();
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('organization', null);
                                 rest.input.onChange(value);
                             },
                         }}
    />);
};

const CreateTitle = () => {
    return <span>Crear usuario</span>;
};

export const UserCreateView = props => {
    const newProps = {...props};
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.onChangeRole;
    delete newProps.formInput;

    return (<Create {...newProps} title={<CreateTitle/>}>
            <SimpleForm className={'userGridLayoutCreateEdit'}>
                <TextInput source="firstName" label="Nombre" validate={[required()]}/>
                <TextInput source="lastName" label="Apellidos"/>
                <TextInput source="email" type="email" validate={[required()]}/>
                <TextInput source="address.postCode" label="Código Postal"/>

                <ReferenceInput source="address.country"
                                label="País"
                                reference="countries"
                                sort={{ field: 'name', order: 'ASC' }}
                                filter={{active: true}}
                                validate={[required()]}
                                onChange={props.onChangeCountry}
                >
                    <FormDataConsumer>
                        {formDataProps => (
                            <CountryInput {...formDataProps} />
                        )}
                    </FormDataConsumer>
                </ReferenceInput>

                <ReferenceInput source="address.province"
                                label="Provincia"
                                onChange={props.onChangeProvince}
                                reference="provinces"
                                disabled={!props.formInput.country}
                                sort={{ field: 'name', order: 'ASC' }}
                                validate={[required()]}
                                filter={{active: true} && props.formInput.country && {countryId: props.formInput.country}}
                >
                    <FormDataConsumer>
                        {formDataProps => (
                            <ProvinceInput {...formDataProps} />
                        )}
                    </FormDataConsumer>
                </ReferenceInput>

                <ReferenceInput source="address.city"
                                label="Municipio"
                                reference="cities"
                                sort={{ field: 'name', order: 'ASC' }}
                                validate={[required()]}
                                filter={{active: true} && props.formInput.province && {provinceId: props.formInput.province}}
                                disabled={!props.formInput.province}
                >
                    <SelectInput optionText="name"/>
                </ReferenceInput>

                <DateInput source="birthday" options={{ format: 'dd/MM/yyyy' }} label="Fecha de nacimiento"/>
                <TextInput source="phone" type="number" label="Teléfono"/>
                {/* <TextInput source="website" label="Sitio web"/> */}

                <SelectInput source="role"
                             label='Rol'
                             validate={[required()]}
                             onChange={props.onChangeRole}
                             choices={[
                                 {id: 'Mentor', name: 'Mentor'},
                                 {id: 'Organización', name: 'Organización'},
                                 {id: 'Super Admin', name: 'Super Admin'},
                             ]}>
                    <FormDataConsumer>
                        {formDataProps => (
                            <RoleInput {...formDataProps} />
                        )}
                    </FormDataConsumer>
                </SelectInput>

                <ReferenceInput source="organization"
                                label="Organización"
                                reference="organizations"
                                sort={{ field: 'name', order: 'ASC' }}
                                disabled={!props.formInput.role || props.formInput.role !== 'Organización'}
                >
                    <SelectInput optionText="name"/>
                </ReferenceInput>

                <BooleanInput source="trust" label="De confianza" initialValue='true' disabled={!props.formInput.role || props.formInput.role !== 'Mentor'}/>
            
                <BooleanInput source="active" label="Activo" initialValue='true'/>

                <ImageInput source="profilePic" label="Foto de perfil" accept="image/*">
                    <ImageField source="src" title="title"/>
                </ImageInput>
            </SimpleForm>
        </Create>
    )
};

function mapStateToProps(state) {
    return {formInput: state.formInput}
}

function mapDispatchToProps(dispatch) {
    return {
        onChangeCountry: (event) => dispatch({type: 'COUNTRY_SELECTED', value: event.target.value}),
        onChangeProvince: (event) => dispatch({type: 'PROVINCE_SELECTED', value: event.target.value}),
        onChangeRole: (event) => dispatch({type: 'ROLE_SELECTED', value: event.target.value}),
    };
}

const UserCreate = connect(mapStateToProps, mapDispatchToProps)(UserCreateView);
export default UserCreate;

