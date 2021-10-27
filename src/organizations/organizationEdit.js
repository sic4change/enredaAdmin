import * as React from "react";
import {
    TextInput,
    SimpleForm,
    required,
    ImageInput,
    ImageField,
    ReferenceInput,
    SelectInput,
    EditController,
    EditView,
    FormDataConsumer,
    BooleanInput
}
    from 'react-admin';
import './organizationStyles.scss';
import {connect} from 'react-redux';
import {useForm} from 'react-final-form';

let country = '';
let province = '';

const ProvinceInput = ({formData, ...rest}) => {
    const form = useForm();
    country = formData.address.country;
    province = formData.address.province;
    return (<SelectInput {...rest}
                         input={{
                             ...rest.input,
                             onChange: value => {
                                 form.change('address.city', null);
                                 rest.input.onChange(value);
                             },
                         }}
                         choices={rest.choices.filter((data) => data.countryId === formData.address.country)}
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

const EditTitle = ({record}) => {
    return <span>Editar organización: {record ? `${record.name}` : ''}</span>;
};

const OrganizationEditView = props => {

    const newProps = {...props};
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.formInput;

   
    return (<EditController {...newProps}>
            {controllerProps =>
                <EditView {...newProps} {...controllerProps} title={<EditTitle/>}>
                    <SimpleForm className={'userGridLayoutCreateEdit'}>
                        <TextInput source="name" label="Nombre" validate={[required()]}/>
                        <TextInput multiline source="description" label="Descripción" />
                        <TextInput source="email" type="email" label="Email" validate={[required()]}/>
                        <TextInput source="phone" type="number" label="Teléfono" validate={[required()]}/>
                        <TextInput source="website" label="Sitio web"/>
                        <TextInput source="address.postCode" label="Código Postal"/>
                        <ReferenceInput source="address.country"
                                label="País"
                                reference="countries"
                                sort={{ field: 'name', order: 'ASC' }}
                                filter={{active: true}}
                                validate={[required()]}
                                onChange={props.onChangeCountry}>
                            <FormDataConsumer>
                                {formDataProps => {
                                    return (
                                        <CountryInput {...formDataProps} />
                                    )
                                }}
                            </FormDataConsumer>
                        </ReferenceInput>

                        <ReferenceInput source="address.province"
                                label="Provincia"
                                onChange={props.onChangeProvince}
                                reference="provinces"
                                sort={{ field: 'name', order: 'ASC' }}
                                validate={[required()]}
                                disabled={country === null}
                                filter={{active: true} && country && {countryId: country}}>
                            <FormDataConsumer>
                                {formDataProps => {
                                    return (
                                        <ProvinceInput {...formDataProps} />
                                        )
                                } }
                            </FormDataConsumer>
                        </ReferenceInput>

                        <ReferenceInput source="address.city"
                                label="Municipio"
                                reference="cities"
                                sort={{ field: 'name', order: 'ASC' }}
                                disabled={province === null}
                                validate={[required()]}
                                filter={{active: true} && province && {provinceId: province}}>
                            <SelectInput optionText="name"/>
                        </ReferenceInput>
                        <BooleanInput source="trust" label="Confiar en sus recursos" validate={[required()]} defaultValue="true"></BooleanInput>
                        <ImageInput source="logoPic" label="Logo de la organización" accept="image/*">
                            <ImageField source="src" title="title"/>
                        </ImageInput>
                    </SimpleForm>
                </EditView>
            }
        </EditController>
    )
};

function mapStateToProps(state) {
    return {formInput: state.formInput}
}

function mapDispatchToProps(dispatch) {
    return {
        onChangeCountry: (event) => {
            dispatch({type: 'COUNTRY_SELECTED', value: event.target.value});
            country = event.target.value;
            province = null;
        } ,
        onChangeProvince: (event) =>{
            dispatch({type: 'PROVINCE_SELECTED', value: event.target.value});
            province = event.target.value;
        } ,
    };
}

const OrganizationEdit = connect(mapStateToProps, mapDispatchToProps)(OrganizationEditView);
export default OrganizationEdit;
