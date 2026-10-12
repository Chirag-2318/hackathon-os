package com.hackathonos.backend.common.config;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CurrentUser currentUser;

    public WebMvcConfig(CurrentUser currentUser) {
        this.currentUser = currentUser;
    }

    private static HandlerMethodArgumentResolver createUserResolver(CurrentUser currentUser) {
        return new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return User.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return currentUser.get();
            }
        };
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(createUserResolver(currentUser));
    }

    @Bean
    public static BeanPostProcessor userArgumentResolverPostProcessor(CurrentUser currentUser) {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof RequestMappingHandlerAdapter adapter) {
                    List<HandlerMethodArgumentResolver> currentResolvers = adapter.getArgumentResolvers();
                    if (currentResolvers != null) {
                        List<HandlerMethodArgumentResolver> newResolvers = new ArrayList<>();
                        newResolvers.add(createUserResolver(currentUser));
                        newResolvers.addAll(currentResolvers);
                        adapter.setArgumentResolvers(newResolvers);
                    }
                }
                return bean;
            }
        };
    }
}

